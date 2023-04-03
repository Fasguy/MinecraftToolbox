import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, ViewChild } from "@angular/core";
import { firstValueFrom, skip } from "rxjs";
import { PanoramaService } from "../../services/panorama-service/panorama.service";
import { ToolboxSettingsService } from "../../services/toolbox-settings/toolbox-settings.service";

@Component({
	selector: "tbx-panorama",
	templateUrl: "./panorama.component.html",
	styleUrls: ["./panorama.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PanoramaComponent implements AfterViewInit {
	private _enabled = false;
	private _panoramaSrcCache: string | undefined;
	private _firstPanoramaRendered = false;
	private _image = document.createElement("img");
	@ViewChild("panorama")
	private _canvas!: ElementRef<HTMLCanvasElement>;
	private _context!: WebGLRenderingContext;
	private _fieldOfViewRadians = this.degToRad(90);
	private _projectionMatrix = [
		1, 0,  0,  0,
		0, 1,  0,  0,
		0, 0, -1, -1,
		0, 0,  0,  0
	];
	//projectionMatrix calculation
	/*
		(() => {
			const aspect = this.context.canvas.clientWidth / this.context.canvas.clientHeight;
			const zNear = 0.1;
			const zFar = 100.0;
			var f = Math.tan(Math.PI * 0.5 - 0.5 * this.fieldOfViewRadians);
			var rangeInv = 1.0 / (zNear - zFar);

			return [
				f / aspect, 0, 0, 0,
				0, f, 0, 0,
				0, 0, (zNear + zFar) * rangeInv, -1,
				0, 0, zNear * zFar * rangeInv * 2, 0
			];
		})();
	*/

	public constructor(
		private _panorama: PanoramaService,
		private _toolboxSettings: ToolboxSettingsService,
		private _changeDetector: ChangeDetectorRef
	) {
		this._image.addEventListener("load", () => {
			this._context.texImage2D(this._context.TEXTURE_2D, 0, this._context.RGBA, this._context.RGBA, this._context.UNSIGNED_BYTE, this._image);
			this._canvas.nativeElement.style.removeProperty("display");
			this.resize();
			this._firstPanoramaRendered = true;
		});
	}

	public ngAfterViewInit(): void {
		this._changeDetector.detach();

		this._context = this._canvas.nativeElement.getContext("webgl")!;
		if (!this._context) {
			this._canvas.nativeElement.remove();
			return;
		}

		this._toolboxSettings.Observe.uselessVisualsEnabled
			.subscribe(uselessVisualsEnabled => {
				this._canvas.nativeElement.style.display = "none";
				this._enabled = false;

				if (uselessVisualsEnabled) {
					this._enabled = true;

					if (this._firstPanoramaRendered) {
						this._canvas.nativeElement.style.removeProperty("display");
					}

					if (this._panoramaSrcCache) {
						this._image.src = this._panoramaSrcCache;
						this._panoramaSrcCache = undefined;
					}
				}

				this.resize();
			});

		this._panorama.Observe.panoramaImage
			.pipe(skip(1))
			.subscribe(async imageUri => {
				let enabled = await firstValueFrom(this._toolboxSettings.Observe.uselessVisualsEnabled);
				if (enabled) {
					this._image.src = imageUri;
				} else {
					this._panoramaSrcCache = imageUri;
				}
			});

		this.resize();
		this.run();
		this._panorama.setIndex("newest");
	}

	private run = () => {
		const program = this.createProgram();

		this._context.bindTexture(this._context.TEXTURE_2D, this._context.createTexture());
		this._context.texParameteri(this._context.TEXTURE_2D, this._context.TEXTURE_WRAP_S, this._context.CLAMP_TO_EDGE);
		this._context.texParameteri(this._context.TEXTURE_2D, this._context.TEXTURE_WRAP_T, this._context.CLAMP_TO_EDGE);
		this._context.texParameteri(this._context.TEXTURE_2D, this._context.TEXTURE_MIN_FILTER, this._context.LINEAR);

		//Panorama Cube
		this._context.bindBuffer(this._context.ARRAY_BUFFER, this._context.createBuffer());
		this._context.bufferData(this._context.ARRAY_BUFFER, new Float32Array([
			-1,  1, -1,  1,  1, -1,  1, -1, -1, -1, -1, -1, // Front
			 1,  1,  1, -1,  1,  1, -1, -1,  1,  1, -1,  1, // Back
			-1,  1,  1,  1,  1,  1,  1,  1, -1, -1,  1, -1, // Top
			-1, -1, -1,  1, -1, -1,  1, -1,  1, -1, -1,  1, // Bottom
			 1,  1, -1,  1,  1,  1,  1, -1,  1,  1, -1, -1, // Right
			-1,  1,  1, -1,  1, -1, -1, -1, -1, -1, -1,  1, // Left
		]), this._context.STATIC_DRAW);

		const vertexPosition = this._context.getAttribLocation(program, "a_vpos");
		this._context.vertexAttribPointer(vertexPosition, 3, this._context.FLOAT, false, 0, 0);
		this._context.enableVertexAttribArray(vertexPosition);

		//Texture Coordinates
		const getTextureCoordinates = (face: number) => {
			let x = face % 3;
			let y = Math.floor(face / 3);

			const thirdFraction = 1 / 3;
			const secondFraction = 1 / 2;

			let result = [
				thirdFraction *					  x, secondFraction * 					 y, // Top-Left
				thirdFraction + (thirdFraction * x), secondFraction * 					 y, // Top-Right
				thirdFraction + (thirdFraction * x), secondFraction + (secondFraction * y), // Bottom-Right
				thirdFraction * 				  x, secondFraction + (secondFraction * y), // Bottom-Left
			];

			const margin = 0.0003;
			return [
				result[0] + margin, result[1] + margin,
				result[2] - margin, result[3] + margin,
				result[4] - margin, result[5] - margin,
				result[6] + margin, result[7] - margin,
			];
		}

		this._context.bindBuffer(this._context.ARRAY_BUFFER, this._context.createBuffer());
		this._context.bufferData(this._context.ARRAY_BUFFER, new Float32Array([
			...getTextureCoordinates(0), // Front
			...getTextureCoordinates(1), // Back
			...getTextureCoordinates(2), // Top
			...getTextureCoordinates(3), // Bottom
			...getTextureCoordinates(4), // Right
			...getTextureCoordinates(5), // Left
		]), this._context.STATIC_DRAW);

		const textureCoord = this._context.getAttribLocation(program, "a_texcoord");
		this._context.vertexAttribPointer(textureCoord, 2, this._context.FLOAT, false, 0, 0);
		this._context.enableVertexAttribArray(textureCoord);

		//Indices
		this._context.bindBuffer(this._context.ELEMENT_ARRAY_BUFFER, this._context.createBuffer());
		this._context.bufferData(this._context.ELEMENT_ARRAY_BUFFER, new Uint16Array([
			 0,  1,  2,  0,  2,  3, // Front
			 4,  5,  6,  4,  6,  7, // Back
			 8,  9, 10,  8, 10, 11, // Top
			12, 13, 14, 12, 14, 15, // Bottom
			16, 17, 18, 16, 18, 19, // Right
			20, 21, 22, 20, 22, 23, // Left
		]), this._context.STATIC_DRAW);

		this._context.uniformMatrix4fv(this._context.getUniformLocation(program, "u_modelmatrix"), false, [
			0, 0, -1, 0,
			0, 1,  0, 0,
			1, 0,  0, 0,
			0, 0,  0, 1,
		]);

		const up = [0, 1, 0];

		let drawScene = (time: number) => {
			if (this._enabled) {
				let rotFactor = time / 1000 * .035;
				let cameraPosition = [Math.cos(rotFactor), (-Math.cos(rotFactor * 2.1) + 1) * 0.5, Math.sin(rotFactor)];
				let cameraMatrix = this.lookAt(cameraPosition, up);
				let viewMatrix = this.inverse(cameraMatrix);
				let viewDirectionProjectionMatrix = this.multiply(this._projectionMatrix, viewMatrix);

				this._context.uniformMatrix4fv(this._context.getUniformLocation(program, "u_projectionmatrix"), false, viewDirectionProjectionMatrix);
				this._context.drawElements(this._context.TRIANGLES, 36, this._context.UNSIGNED_SHORT, 0);
			}

			requestAnimationFrame(drawScene);
		}
		drawScene(0);
	}

	@HostListener("window:resize", ["$event"])
	public resize = () => {
		if (!this._enabled) return;

		let canvas = this._canvas.nativeElement;

		let zoomFactor = window.devicePixelRatio || window.screen.availWidth / document.documentElement.clientWidth;

		canvas.width = window.innerWidth * zoomFactor;
		canvas.height = window.innerHeight * zoomFactor;
		this._context.viewport(0, 0, canvas.width, canvas.height);
		let aspect = canvas.clientWidth / canvas.clientHeight;
		let f = Math.tan(Math.PI * 0.5 - 0.5 * this._fieldOfViewRadians);
		this._projectionMatrix[0] = f / aspect;
		this._projectionMatrix[5] = f;
	}

	private createProgram() {
		const program = this._context.createProgram()!;

		let vertex = this._context.createShader(this._context.VERTEX_SHADER)!;
		this._context.shaderSource(vertex, `attribute vec4 a_vpos;attribute vec2 a_texcoord;uniform mat4 u_modelmatrix;uniform mat4 u_projectionmatrix;varying highp vec2 v_texcoord;void main(void){gl_Position=u_projectionmatrix*u_modelmatrix*a_vpos;v_texcoord=a_texcoord;}`);
		this._context.compileShader(vertex);
		this._context.attachShader(program, vertex);

		let fragment = this._context.createShader(this._context.FRAGMENT_SHADER)!;
		this._context.shaderSource(fragment, `varying highp vec2 v_texcoord;uniform sampler2D u_sampler;void main(void){gl_FragColor=texture2D(u_sampler,v_texcoord);}`);
		this._context.compileShader(fragment);
		this._context.attachShader(program, fragment);

		this._context.linkProgram(program);
		this._context.useProgram(program);

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
				v[2] / length,
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
		let tmp_00 = m22 * m33;
		let tmp_01 = m32 * m23;
		let tmp_02 = m12 * m33;
		let tmp_03 = m32 * m13;
		let tmp_04 = m12 * m23;
		let tmp_05 = m22 * m13;
		let tmp_06 = m02 * m33;
		let tmp_07 = m32 * m03;
		let tmp_08 = m02 * m23;
		let tmp_09 = m22 * m03;
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
			(tmp_00 * m11 + tmp_03 * m21 + tmp_04 * m31) - (tmp_01 * m11 + tmp_02 * m21 + tmp_05 * m31),
			(tmp_01 * m01 + tmp_06 * m21 + tmp_09 * m31) - (tmp_00 * m01 + tmp_07 * m21 + tmp_08 * m31),
			(tmp_02 * m01 + tmp_07 * m11 + tmp_10 * m31) - (tmp_03 * m01 + tmp_06 * m11 + tmp_11 * m31),
			0,
			(tmp_01 * m10 + tmp_02 * m20 + tmp_05 * m30) - (tmp_00 * m10 + tmp_03 * m20 + tmp_04 * m30),
			(tmp_00 * m00 + tmp_07 * m20 + tmp_08 * m30) - (tmp_01 * m00 + tmp_06 * m20 + tmp_09 * m30),
			(tmp_03 * m00 + tmp_06 * m10 + tmp_11 * m30) - (tmp_02 * m00 + tmp_07 * m10 + tmp_10 * m30),
			0,
			(tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) - (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33),
			(tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) - (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33),
			(tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) - (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33),
			0,
			(tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) - (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22),
			(tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) - (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02),
			(tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) - (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12),
			(tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) - (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02),
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
			b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
		];
	}

	private cross(a: number[], b: number[]) {
		return [
			a[1] * b[2] - a[2] * b[1],
			a[2] * b[0] - a[0] * b[2],
			a[0] * b[1] - a[1] * b[0],
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
			       0,        0,        0, 1,
		];
	}
}