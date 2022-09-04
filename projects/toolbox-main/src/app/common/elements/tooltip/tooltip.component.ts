import { ChangeDetectionStrategy, Component, HostListener, Input } from '@angular/core';

@Component({
	selector: '[tooltip]',
	template: '<ng-content></ng-content>',
	styleUrls: ['./tooltip.component.scss'],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TooltipComponent {
	private static _tooltipDisplay = (() => {
		let tooltip = document.createElement("div");
		tooltip.classList.add("tooltip");
		document.body.appendChild(tooltip);
		return tooltip;
	})();

	@Input()
	public tooltip!: string;

	@HostListener("mousemove", ["$event"])
	private mousemove(e: MouseEvent): void {
		TooltipComponent._tooltipDisplay.innerHTML = this.tooltip;
		TooltipComponent._tooltipDisplay.style.left = `${e.clientX + 10}px`;
		TooltipComponent._tooltipDisplay.style.top = `${e.clientY + 10}px`;
	}

	@HostListener("mouseleave", ["$event"])
	private mouseleave(e: MouseEvent): void {
		TooltipComponent._tooltipDisplay.style.removeProperty("display");
	}

	@HostListener("mouseenter", ["$event"])
	private mouseenter(e: MouseEvent): void {
		TooltipComponent._tooltipDisplay.style.display = "block";
	}
}