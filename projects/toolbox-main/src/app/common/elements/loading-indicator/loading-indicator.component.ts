import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, ViewChild } from "@angular/core";
import { randomRange } from "src/lib/utils";

@Component({
	selector: "tbx-loading-indicator",
	templateUrl: "./loading-indicator.component.html",
	styleUrls: ["./loading-indicator.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class LoadingIndicatorComponent implements AfterViewInit {
	@ViewChild("item")
	private item!: ElementRef<HTMLElement>;

	public ngAfterViewInit(): void {
		let animationListener = (e: AnimationEvent) => {
			(<HTMLElement>e.target).style.backgroundPositionX = `calc(100% * ${randomRange(0, 3)})`;
		};

		animationListener(<AnimationEvent><unknown>{ target: this.item.nativeElement });
		this.item.nativeElement.addEventListener("animationstart", animationListener);
		this.item.nativeElement.addEventListener("animationiteration", animationListener);
	}
}