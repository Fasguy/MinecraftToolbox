import { ChangeDetectionStrategy, Component } from "@angular/core";

@Component({
	selector: "tbx-error-indicator",
	templateUrl: "./error-indicator.component.html",
	styleUrls: ["./error-indicator.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorIndicatorComponent {
}