import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from "@angular/core";
import { IWindow } from "src/app/common/views/window/window.component";

@Component({
	templateUrl: "./instructions.component.html",
	styleUrls: ["./instructions.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
	// See https://github.com/angular/angular/issues/50158
	host: { "collision-id": "cr" }
})
export class CraftingRecipeRandomizerInstructionsComponent implements IWindow {
	public title: string = "Crafting-Recipe Randomizer - Instructions";

	public constructor(changeDetector: ChangeDetectorRef) {
		changeDetector.detach();
	}
}