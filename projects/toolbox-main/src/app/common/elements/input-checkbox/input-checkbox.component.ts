import { Component, Input, Renderer2, ViewContainerRef } from '@angular/core';
import { AbstractHostExtender } from '../host-extender/host-extender';

@Component({
	selector: 'input[standard][type=checkbox]',
	templateUrl: './input-checkbox.component.html',
	styleUrls: ['./input-checkbox.component.scss']
})
export class InputCheckboxComponent extends AbstractHostExtender {
	@Input() text: string | undefined;

	constructor(
		viewContainerRef: ViewContainerRef,
		renderer: Renderer2
	) {
		super(viewContainerRef, renderer);
	}
}