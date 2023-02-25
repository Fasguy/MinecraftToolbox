import { Component } from "@angular/core";
import { IWindow } from "src/app/common/views/window/window.component";

@Component({
	templateUrl: "./frequently-asked-questions.component.html",
	styleUrls: ["./frequently-asked-questions.component.scss"]
})
export class LootTableRandomizerFAQComponent implements IWindow {
	public title: string = "Loot-Table Randomizer - Frequently Asked Questions";
}