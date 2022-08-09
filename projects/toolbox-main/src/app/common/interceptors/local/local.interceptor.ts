import { APP_BASE_HREF } from '@angular/common';
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { trimEnd, trimStart } from 'src/lib/utils';

@Injectable()
export class LocalInterceptor implements HttpInterceptor {
	constructor(
		@Inject(APP_BASE_HREF) private _baseHref: string
	) {
	}

	intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
		if (request.url.startsWith("http")) return next.handle(request);

		const localRequest = request.clone({ url: `${trimEnd(this._baseHref, "/")}/${trimStart(request.url, "/")}` });

		return next.handle(localRequest);
	}
}