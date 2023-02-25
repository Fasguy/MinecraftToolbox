import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
	selector: "input[standard][type=text]",
	template: "",
	styleUrls: ["./input.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class InputComponent {
}