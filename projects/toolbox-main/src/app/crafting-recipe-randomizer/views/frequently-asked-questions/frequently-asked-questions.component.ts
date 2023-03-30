import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from "@angular/core";

@Component({
	templateUrl: "./frequently-asked-questions.component.html",
	styleUrls: ["./frequently-asked-questions.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class CraftingRecipeRandomizerFAQComponent {
	public title: string = "Crafting-Recipe Randomizer - Frequently Asked Questions";

	public constructor(changeDetector: ChangeDetectorRef) {
		changeDetector.detach();
	}
}