import { Component } from "@angular/core";
import { IWindow } from "../../window/window.component";

@Component({
	templateUrl: "./preset-warning.component.html",
	styleUrls: ["./preset-warning.component.scss"]
})
export class PresetWarningComponent implements IWindow {
	public title: string = "Warning";

	public text: string = "This will overwrite your current settings. Are you sure you want to continue?";
}