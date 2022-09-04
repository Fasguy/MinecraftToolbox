import { Component } from '@angular/core';

@Component({
	selector: 'tbx-panorama-generator',
	templateUrl: './panorama-generator.component.html',
	styleUrls: ['./panorama-generator.component.scss']
})
export class PanoramaGeneratorComponent {
	public finalFile?: string;

	public async prepare(e: Event) {
		e.preventDefault();
		e.stopPropagation();

		let formData = new FormData(<HTMLFormElement>e.target);
		let files = <File[]>formData.getAll("panoramas");

		let images = await Promise.all(files.map(this.readAsImage));

		images = [
			images.find(x => x.name.endsWith("0"))!, // Front
			images.find(x => x.name.endsWith("2"))!, // Back
			images.find(x => x.name.endsWith("4"))!, // Top
			images.find(x => x.name.endsWith("5"))!, // Bottom
			images.find(x => x.name.endsWith("1"))!, // Right
			images.find(x => x.name.endsWith("3"))!, // Left
		]

		let canvas = document.createElement("canvas");
		let ctx = canvas.getContext("2d")!;

		canvas.width = images[0].data.naturalWidth * 3;
		canvas.height = images[0].data.naturalHeight * 2;

		for (let i = 0; i < images.length; i++) {
			let img = images[i].data;
			let x = i % 3;
			let y = Math.floor(i / 3);
			console.log(x, y);

			ctx.drawImage(img, x * img.naturalWidth, y * img.naturalHeight);
		}

		this.finalFile = canvas.toDataURL();
	}

	private async readAsImage(file: File) {
		let asyncData = async () => {
			return new Promise<HTMLImageElement>((resolve, reject) => {
				let reader = new FileReader();

				reader.addEventListener("load", () => {
					let img = new Image();

					img.addEventListener("load", () => {
						resolve(img);
					});

					img.src = <string>reader.result;
				});

				reader.readAsDataURL(file);
			});
		}

		return {
			name: file.name.substring(0, file.name.lastIndexOf(".")),
			data: await asyncData()
		}
	}
}
