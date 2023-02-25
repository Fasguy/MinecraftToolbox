import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";
import { serializeError } from "serialize-error";
import { ErrorHandlerComponent } from "../../elements/error-handler/error-handler.component";

@Injectable({
	providedIn: "root"
})
export class ErrorHandlerService {
	private _errorHandler!: ErrorHandlerComponent;
	private _error = new BehaviorSubject<Error | null>(null);

	public errorDetails: string | null = null;

	public get error() {
		return this._error.getValue();
	}

	public set error(value: Error | null) {
		if (value) {
			console.error(value);
			this.errorDetails = JSON.stringify(serializeError(value), null, "\t");
		} else {
			this.errorDetails = null;
		}

		this._error.next(value);
	}

	public setErrorHandler(activityMonitor: ErrorHandlerComponent) {
		if (this._errorHandler) throw new Error("An error handler is already set.");

		this._errorHandler = activityMonitor;
		this._error.subscribe(error => {
			this._errorHandler.enabled = error != void (0);
		});
	}
}