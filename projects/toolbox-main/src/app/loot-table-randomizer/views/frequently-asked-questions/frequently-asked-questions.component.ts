import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from "@angular/core";
import { IWindow } from "src/app/common/views/window/window.component";

@Component({
	templateUrl: "./frequently-asked-questions.component.html",
	styleUrls: ["./frequently-asked-questions.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
	// See https://github.com/angular/angular/issues/50158
	host: { "collision-id": "lt" }
})
export class LootTableRandomizerFAQComponent implements IWindow {
	public title: string = "Loot-Table Randomizer - Frequently Asked Questions";

	public constructor(changeDetector: ChangeDetectorRef) {
		changeDetector.detach();
	}
}