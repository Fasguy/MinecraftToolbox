import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable({
	providedIn: "root"
})
export class NetRequestService {
	private _uncachedHeaders = new HttpHeaders({
		"Cache-Control": "no-cache, no-store, must-revalidate, post-check=0, pre-check=0",
		"Pragma": "no-cache",
		"Expires": "0"
	});

	constructor(
		private _http: HttpClient
	) {
	}

	public binary(url: string) {
		return this._http.get(url, { responseType: "arraybuffer", headers: this._uncachedHeaders });
	}
}