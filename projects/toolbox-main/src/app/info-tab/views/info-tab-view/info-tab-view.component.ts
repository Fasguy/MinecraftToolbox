import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component } from "@angular/core";

@Component({
	selector: "tbx-info-tab",
	templateUrl: "./info-tab-view.component.html",
	styleUrls: ["./info-tab-view.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class InfoTabViewComponent implements AfterViewInit {
	public constructor(
		private _changeDetector: ChangeDetectorRef
	) {
	}

	public ngAfterViewInit(): void {
		this._changeDetector.detach();
	}
}