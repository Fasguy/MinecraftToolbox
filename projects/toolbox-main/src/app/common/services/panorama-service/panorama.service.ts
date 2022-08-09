import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, firstValueFrom } from 'rxjs';

@Injectable({
	providedIn: 'root'
})
export class PanoramaService {
	private definitions!: PanoramaDefinitions;
	private panoramaImageSource = new BehaviorSubject("newest");

	constructor(
		private _http: HttpClient
	) {
	}

	public async setIndex(id: string) {
		let def = this.definitions ?? (this.definitions = await firstValueFrom(this._http.get<PanoramaDefinitions>("resources/data/panorama.json")));

		if (!def[id]) {
			console.warn(`Panorama with the id '${id}' not found.`);
		}

		this.panoramaImageSource.next(def[id] ?? def["newest"]);
	}

	public Observe = {
		panoramaImage: this.panoramaImageSource.asObservable()
	}
}

interface PanoramaDefinitions {
	[key: string]: string;
}