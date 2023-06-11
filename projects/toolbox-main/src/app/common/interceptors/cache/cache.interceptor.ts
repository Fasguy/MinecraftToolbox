import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, of, tap } from "rxjs";

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
	private _cache: Map<string, HttpResponse<any>> = new Map();

	public intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		if (req.method !== "GET" || req.headers.get("disable-cache")) {
			return next.handle(req);
		}

		const cacheKey = req.urlWithParams;

		const cachedResponse: HttpResponse<any> | undefined = this._cache.get(cacheKey);

		if (cachedResponse) {
			return of(cachedResponse.clone());
		} else {
			return next.handle(req).pipe(
				tap(stateEvent => {
					if (stateEvent instanceof HttpResponse) {
						this._cache.set(cacheKey, stateEvent.clone());
					}
				})
			);
		}
	}
}