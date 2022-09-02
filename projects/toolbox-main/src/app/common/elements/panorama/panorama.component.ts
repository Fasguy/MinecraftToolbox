import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener, ViewChild } from '@angular/core';
import { firstValueFrom, skip } from 'rxjs';
import { PanoramaService } from '../../services/panorama-service/panorama.service';
import { ToolboxSettingsService } from '../../services/toolbox-settings/toolbox-settings.service';

//#4 TODO: Change the cube-texturing method from individual textures to texture coordinates.
//		This would allow for more efficient texture rendering, as well as removing the need to
//		load the individual parts as separate images, reducing the memory footprint and processing time.

@Component({
	selector: 'tbx-panorama',
	templateUrl: './panorama.component.html',
	styleUrls: ['./panorama.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PanoramaComponent implements AfterViewInit {
	private _panoramaSrcCache: string | undefined;
	private _firstPanoramaRendered = false;

	@ViewChild("panorama")
	private canvas!: ElementRef<HTMLCanvasElement>;
	private context!: WebGLRenderingContext;
	private fieldOfViewRadians = this.degToRad(90);
	private projectionMatrix = [
		0, 0, 0, 0,
		0, 0, 0, 0,
		0, 0, -3, -1,
		0, 0, -4, 0
	];

	public constructor(
		private _panorama: PanoramaService,
		private _toolboxSettings: ToolboxSettingsService,
	) {
	}

	public ngAfterViewInit(): void {
		this.context = this.canvas.nativeElement.getContext("webgl")!;
		if (!this.context) {
			this.canvas.nativeElement.remove();
			return;
		}

		this._toolboxSettings.Observe.uselessVisualsEnabled
			.subscribe(uselessVisualsEnabled => {
				this.canvas.nativeElement.style.display = 'none';
				if (uselessVisualsEnabled && this._firstPanoramaRendered) {
					this.canvas.nativeElement.style.removeProperty('display');
				}

				if (uselessVisualsEnabled && this._panoramaSrcCache) {
					this.setCubemap(this._panoramaSrcCache, this.context);
					this._panoramaSrcCache = undefined;
				}

				this.resize();
			});

		this.canvas.nativeElement.style.display = "none";

		this._panorama.Observe.panoramaImage
			.pipe(skip(1))
			.subscribe(async imageUri => {
				let enabled = await firstValueFrom(this._toolboxSettings.Observe.uselessVisualsEnabled);
				if (enabled) {
					this.setCubemap(imageUri, this.context);
				} else {
					this._panoramaSrcCache = imageUri;
				}
			});

		this.resize();
		this.run(this.context);
		this._panorama.setIndex("newest");
	}

	private run = (context: WebGLRenderingContext) => {
		let up = [0, 1, 0];
		let program = this.createProgram(context);
		let positionLocation = context.getAttribLocation(program, "a_pos");
		let viewDirectionProjectionInverseLocation = context.getUniformLocation(program, "u_ivdp");
		context.enableVertexAttribArray(positionLocation);
		context.bindBuffer(context.ARRAY_BUFFER, context.createBuffer());
		context.bufferData(context.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), context.STATIC_DRAW);
		context.bindTexture(context.TEXTURE_CUBE_MAP, context.createTexture());
		context.texParameteri(context.TEXTURE_CUBE_MAP, context.TEXTURE_MIN_FILTER, context.LINEAR);
		context.vertexAttribPointer(positionLocation, 2, context.FLOAT, false, 0, 0);

		let drawScene = (time: number) => {
			let rotFactor = time / 1000 * .035;
			let cameraPosition = [Math.cos(rotFactor), (-Math.cos(rotFactor * 2.1) + 1) * .5, Math.sin(rotFactor)];
			let cameraMatrix = this.lookAt(cameraPosition, up);
			let viewMatrix = this.inverse(cameraMatrix);
			let viewDirectionProjectionMatrix = this.multiply(this.projectionMatrix, viewMatrix);
			let viewDirectionProjectionInverseMatrix = this.inverse(viewDirectionProjectionMatrix);
			context.uniformMatrix4fv(viewDirectionProjectionInverseLocation, false, viewDirectionProjectionInverseMatrix);
			context.drawArrays(context.TRIANGLES, 0, 6);

			requestAnimationFrame(drawScene);
		}
		drawScene(0);
	}

	private createSides(image: HTMLImageElement) {
		let cubeDimension = image.height / 2;

		let sideCanvas = document.createElement('canvas');
		let sideContext = sideCanvas.getContext('2d')!;
		sideCanvas.width = cubeDimension;
		sideCanvas.height = cubeDimension;

		sideContext.translate(cubeDimension, 0);
		sideContext.scale(-1, 1);

		let faces: HTMLImageElement[] = [];
		const event = new CustomEvent('created', { detail: faces });
		let elem = document.createElement('object');
		for (let cubemapIndex = 0; cubemapIndex < 6; cubemapIndex++) {
			let x = cubemapIndex % 3;
			let y = Math.floor(cubemapIndex / 3);
			sideContext.drawImage(image, x * cubeDimension, y * cubeDimension, cubeDimension, cubeDimension, 0, 0, cubeDimension, cubeDimension);
			sideCanvas.toBlob((blob) => {
				let cubemapFace = document.createElement('img');
				let url = URL.createObjectURL(blob!);

				cubemapFace.addEventListener('load', () => {
					URL.revokeObjectURL(url);
					faces[cubemapIndex] = cubemapFace;
					if (faces.filter(Boolean).length === 6) {
						elem.dispatchEvent(event);
					}
				});

				cubemapFace.src = url;
			});
		}
		return elem;
	}

	private setCubemap = (uri: string, gl: WebGLRenderingContext) => {
		let faces = [
			gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
			gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
			gl.TEXTURE_CUBE_MAP_POSITIVE_X,
			gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
			gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
			gl.TEXTURE_CUBE_MAP_NEGATIVE_Y
		];
		let img = document.createElement('img');
		img.addEventListener('load', () => {
			this.createSides(img).addEventListener('created', (e) => {
				let i = 0;
				(<CustomEvent>e).detail.forEach((face: TexImageSource) => {
					gl.texImage2D(faces[i++], 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, face);
				});
				this.canvas.nativeElement.style.removeProperty('display');
				this.resize();
				this._firstPanoramaRendered = true;
			});
		});
		img.src = uri;
	}

	@HostListener('window:resize', ['$event'])
	public resize = () => {
		let canvas = this.canvas.nativeElement;

		let zoomFactor = window.devicePixelRatio || window.screen.availWidth / document.documentElement.clientWidth;

		canvas.width = window.innerWidth * zoomFactor;
		canvas.height = window.innerHeight * zoomFactor;
		this.context.viewport(0, 0, canvas.width, canvas.height);
		let aspect = canvas.clientWidth / canvas.clientHeight;
		let f = Math.tan(Math.PI * 0.5 - 0.5 * this.fieldOfViewRadians);
		this.projectionMatrix[0] = f / aspect;
		this.projectionMatrix[5] = f;
	}

	private createProgram(context: WebGLRenderingContext) {
		const program = context.createProgram()!;

		let vertex = context.createShader(context.VERTEX_SHADER)!;
		context.shaderSource(vertex, 'attribute vec4 a_pos;varying vec4 v_pos;void main(){v_pos=a_pos;gl_Position=a_pos;}');
		context.compileShader(vertex);
		context.attachShader(program, vertex);

		let fragment = context.createShader(context.FRAGMENT_SHADER)!;
		context.shaderSource(fragment, 'precision mediump float;uniform samplerCube u_sky;uniform mat4 u_ivdp;varying vec4 v_pos;void main(){vec4 t=u_ivdp*v_pos;gl_FragColor=textureCube(u_sky,normalize(t.xyz/t.w));}');
		context.compileShader(fragment);
		context.attachShader(program, fragment);

		context.linkProgram(program);
		context.useProgram(program);

		return program;
	}

	private degToRad(d: number) {
		return d * Math.PI / 180;
	}

	private normalize(v: number[]) {
		let length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
		if (length > 0) {
			return [
				v[0] / length,
				v[1] / length,
				v[2] / length
			];
		}
		return v;
	}

	private inverse(m: number[]) {
		let m00 = m[0 * 4 + 0];
		let m01 = m[0 * 4 + 1];
		let m02 = m[0 * 4 + 2];
		let m03 = m[0 * 4 + 3];
		let m10 = m[1 * 4 + 0];
		let m11 = m[1 * 4 + 1];
		let m12 = m[1 * 4 + 2];
		let m13 = m[1 * 4 + 3];
		let m20 = m[2 * 4 + 0];
		let m21 = m[2 * 4 + 1];
		let m22 = m[2 * 4 + 2];
		let m23 = m[2 * 4 + 3];
		let m30 = m[3 * 4 + 0];
		let m31 = m[3 * 4 + 1];
		let m32 = m[3 * 4 + 2];
		let m33 = m[3 * 4 + 3];
		let tmp_0 = m22 * m33;
		let tmp_1 = m32 * m23;
		let tmp_2 = m12 * m33;
		let tmp_3 = m32 * m13;
		let tmp_4 = m12 * m23;
		let tmp_5 = m22 * m13;
		let tmp_6 = m02 * m33;
		let tmp_7 = m32 * m03;
		let tmp_8 = m02 * m23;
		let tmp_9 = m22 * m03;
		let tmp_10 = m02 * m13;
		let tmp_11 = m12 * m03;
		let tmp_12 = m20 * m31;
		let tmp_13 = m30 * m21;
		let tmp_14 = m10 * m31;
		let tmp_15 = m30 * m11;
		let tmp_16 = m10 * m21;
		let tmp_17 = m20 * m11;
		let tmp_18 = m00 * m31;
		let tmp_19 = m30 * m01;
		let tmp_20 = m00 * m21;
		let tmp_21 = m20 * m01;
		let tmp_22 = m00 * m11;
		let tmp_23 = m10 * m01;

		return [
			(tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) - (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31),
			(tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) - (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31),
			(tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) - (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31),
			0,
			(tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) - (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30),
			(tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) - (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30),
			(tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) - (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30),
			0,
			(tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) - (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33),
			(tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) - (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33),
			(tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) - (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33),
			0,
			(tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) - (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22),
			(tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) - (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02),
			(tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) - (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12),
			(tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) - (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02)
		];
	}

	private multiply(a: number[], b: number[]) {
		let b00 = b[0 * 4 + 0];
		let b01 = b[0 * 4 + 1];
		let b02 = b[0 * 4 + 2];
		let b03 = b[0 * 4 + 3];
		let b10 = b[1 * 4 + 0];
		let b11 = b[1 * 4 + 1];
		let b12 = b[1 * 4 + 2];
		let b13 = b[1 * 4 + 3];
		let b20 = b[2 * 4 + 0];
		let b21 = b[2 * 4 + 1];
		let b22 = b[2 * 4 + 2];
		let b23 = b[2 * 4 + 3];
		let b30 = b[3 * 4 + 0];
		let b31 = b[3 * 4 + 1];
		let b32 = b[3 * 4 + 2];
		let b33 = b[3 * 4 + 3];
		let a00 = a[0 * 4 + 0];
		let a01 = a[0 * 4 + 1];
		let a02 = a[0 * 4 + 2];
		let a03 = a[0 * 4 + 3];
		let a10 = a[1 * 4 + 0];
		let a11 = a[1 * 4 + 1];
		let a12 = a[1 * 4 + 2];
		let a13 = a[1 * 4 + 3];
		let a20 = a[2 * 4 + 0];
		let a21 = a[2 * 4 + 1];
		let a22 = a[2 * 4 + 2];
		let a23 = a[2 * 4 + 3];
		let a30 = a[3 * 4 + 0];
		let a31 = a[3 * 4 + 1];
		let a32 = a[3 * 4 + 2];
		let a33 = a[3 * 4 + 3];

		return [
			b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
			b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
			b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
			b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
			b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
			b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
			b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
			b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
			b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
			b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
			b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
			b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
			b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
			b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
			b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
			b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33
		];
	}

	private cross(a: number[], b: number[]) {
		return [
			a[1] * b[2] - a[2] * b[1],
			a[2] * b[0] - a[0] * b[2],
			a[0] * b[1] - a[1] * b[0]
		];
	}

	private lookAt = (cameraPosition: number[], up: number[]) => {
		let zAxis = this.normalize(cameraPosition);
		let xAxis = this.normalize(this.cross(up, zAxis));
		let yAxis = this.normalize(this.cross(zAxis, xAxis));

		return [
			xAxis[0], xAxis[1], xAxis[2], 0,
			yAxis[0], yAxis[1], yAxis[2], 0,
			zAxis[0], zAxis[1], zAxis[2], 0,
			0, 0, 0, 1
		];
	}
}