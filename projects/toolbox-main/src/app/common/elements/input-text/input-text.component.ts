import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from "@angular/core";

@Component({
	selector: "input[standard][type=text]",
	template: "",
	styleUrls: ["./input-text.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputTextComponent {
	public constructor(changeDetector: ChangeDetectorRef) {
		changeDetector.detach();
	}
}