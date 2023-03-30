import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild } from "@angular/core";
import { randomRange } from "src/lib/utils";

@Component({
	selector: "tbx-loading-indicator",
	templateUrl: "./loading-indicator.component.html",
	styleUrls: ["./loading-indicator.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingIndicatorComponent implements AfterViewInit {
	@ViewChild("item")
	private _item!: ElementRef<HTMLElement>;

	public constructor(
		private _changeDetector: ChangeDetectorRef
	) {
	}

	public ngAfterViewInit(): void {
		this._changeDetector.detach();

		let animationListener = (e: AnimationEvent) => {
			(<HTMLElement>e.target).style.backgroundPositionX = `calc(100% * ${randomRange(0, 3)})`;
		};

		animationListener(<AnimationEvent><unknown>{ target: this._item.nativeElement });
		this._item.nativeElement.addEventListener("animationstart", animationListener);
		this._item.nativeElement.addEventListener("animationiteration", animationListener);
	}
}