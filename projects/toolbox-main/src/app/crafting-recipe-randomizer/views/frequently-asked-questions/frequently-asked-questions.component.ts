import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from "@angular/core";
import { IWindow } from "src/app/common/views/window/window.component";

@Component({
	templateUrl: "./frequently-asked-questions.component.html",
	styleUrls: ["./frequently-asked-questions.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
	// See https://github.com/angular/angular/issues/50158
	host: { "collision-id": "cr" }
})
export class CraftingRecipeRandomizerFAQComponent implements IWindow {
	public title: string = "Crafting-Recipe Randomizer - Frequently Asked Questions";

	public constructor(changeDetector: ChangeDetectorRef) {
		changeDetector.detach();
	}
}