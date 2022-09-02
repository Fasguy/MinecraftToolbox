import { Component, ElementRef, OnInit } from '@angular/core';
import { ErrorHandlerService } from '../../services/error-handler/error-handler.service';

@Component({
	selector: 'tbx-error-handler',
	templateUrl: './error-handler.component.html',
	styleUrls: ['./error-handler.component.scss']
})
export class ErrorHandlerComponent implements OnInit {
	public set enabled(enabled: boolean) {
		this._ref.nativeElement.style.display = enabled ? "block" : "none";
	}

	constructor(
		private _ref: ElementRef,
		public errorHandler: ErrorHandlerService
	) {
	}

	public ngOnInit(): void {
		this.errorHandler.setErrorHandler(this);
	}

	protected reportIssue() {
		window.open("https://github.com/Fasguy/MinecraftToolbox/issues", "_blank", "noopener,noreferrer")
	}

	protected close() {
		this.errorHandler.error = null;
	}
}