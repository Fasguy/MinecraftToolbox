import { Injectable, ViewContainerRef } from '@angular/core';
import { WindowComponent } from '../../views/window/window.component';

@Injectable({
	providedIn: 'root'
})
export class WindowService {
	public windowContainer!: ViewContainerRef;

	public createWindow(childComponent: any) {
		let componentRef = this.windowContainer.createComponent(WindowComponent);
		componentRef.instance.selfRef = componentRef;
		componentRef.instance.createChildComponent(childComponent);
	}
}