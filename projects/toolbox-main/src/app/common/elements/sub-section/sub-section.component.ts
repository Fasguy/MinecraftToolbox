import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from "@angular/core";

@Component({
	selector: "tbx-sub-section",
	templateUrl: "./sub-section.component.html",
	styleUrls: ["./sub-section.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class SubSectionComponent implements AfterViewInit {
	@Input()
	public header!: string;

	public constructor(
		private _changeDetector: ChangeDetectorRef
	) {
	}

	public ngAfterViewInit(): void {
		this._changeDetector.detach();
	}
}