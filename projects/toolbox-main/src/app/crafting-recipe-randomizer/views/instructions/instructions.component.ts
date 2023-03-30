import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from "@angular/core";

@Component({
	templateUrl: "./instructions.component.html",
	styleUrls: ["./instructions.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CraftingRecipeRandomizerInstructionsComponent {
	public title: string = "Crafting-Recipe Randomizer - Instructions";

	public constructor(changeDetector: ChangeDetectorRef) {
		changeDetector.detach();
	}
}