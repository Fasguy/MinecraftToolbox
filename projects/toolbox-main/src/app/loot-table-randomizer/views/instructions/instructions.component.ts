import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from "@angular/core";
import { IWindow } from "src/app/common/views/window/window.component";

@Component({
	templateUrl: "./instructions.component.html",
	styleUrls: ["./instructions.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush,
	// See https://github.com/angular/angular/issues/50158
	host: { "collision-id": "lt" }
})
export class LootTableRandomizerInstructionsComponent implements IWindow {
	public title: string = "Loot-Table Randomizer - Instructions";

	public constructor(changeDetector: ChangeDetectorRef) {
		changeDetector.detach();
	}
}