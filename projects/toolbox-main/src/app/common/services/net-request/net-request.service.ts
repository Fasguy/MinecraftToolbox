import { HttpClient, HttpContext, HttpHeaders, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";
import packageJson from "../../../../../../../package.json";

@Injectable({
	providedIn: "root"
})
export class NetRequestService {
	private _uncachedHeaders = new HttpHeaders({
		"Cache-Control": "no-cache, no-store, must-revalidate, post-check=0, pre-check=0",
		"Pragma": "no-cache",
		"Expires": "0"
	});

	public constructor(
		private _http: HttpClient
	) {
	}

	/**
	 * Constructs a `GET` request that interprets the body as JSON and returns
	 * the response body in a given type.
	 *
	 * @param url     The endpoint URL.
	 * @param options The HTTP options to send with the request.
	 *
	 * @return An `Observable` of the `HttpResponse`, with a response body in the requested type.
	 */
	get<T>(url: string, options?: {
		headers?: HttpHeaders | {
			[header: string]: string | string[];
		};
		context?: HttpContext;
		observe?: 'body';
		params?: HttpParams | {
			[param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
		};
		reportProgress?: boolean;
		responseType?: 'json' | 'arraybuffer' | 'blob' | 'text';
		withCredentials?: boolean;
	}): Observable<T> {
		//Cache-busting on a per-version basis. Not as effective as fingerprinting, but it's better than nothing.
		return <any>this._http.get<T>(url + `?v=${packageJson.version}`, <any>options);
	}

	/**
	 * Constructs a `GET` request that interprets the body as JSON and returns
	 * the response body in a given type.
	 *
	 * @param url     The endpoint URL.
	 * @param options The HTTP options to send with the request.
	 *
	 * @return An `Observable` of the `HttpResponse`, with a response body in the requested type.
	 */
	getUncached<T>(url: string, options?: {
		headers?: HttpHeaders | {
			[header: string]: string | string[];
		};
		context?: HttpContext;
		observe?: 'body';
		params?: HttpParams | {
			[param: string]: string | number | boolean | ReadonlyArray<string | number | boolean>;
		};
		reportProgress?: boolean;
		responseType?: 'json' | 'arraybuffer' | 'blob' | 'text';
		withCredentials?: boolean;
	}): Observable<T> {
		return <any>this._http.get<T>(url, { ...(<any>options), headers: this._uncachedHeaders });
	}
}