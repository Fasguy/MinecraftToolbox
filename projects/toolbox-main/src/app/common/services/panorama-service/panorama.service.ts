import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, firstValueFrom } from "rxjs";

@Injectable({
	providedIn: "root"
})
export class PanoramaService {
	private _definitions!: PanoramaDefinitions;
	private _panoramaImageSource = new BehaviorSubject("newest");

	public constructor(
		private _http: HttpClient
	) {
	}

	public async setIndex(id: string) {
		let def = this._definitions ?? (this._definitions = await firstValueFrom(this._http.get<PanoramaDefinitions>("resources/data/panorama.json")));

		if (!def[id]) {
			console.warn(`Panorama with the id '${id}' not found.`);
		}

		this._panoramaImageSource.next(def[id] ?? def["newest"]);
	}

	public Observe = {
		panoramaImage: this._panoramaImageSource.asObservable()
	}
}

interface PanoramaDefinitions {
	[key: string]: string;
}