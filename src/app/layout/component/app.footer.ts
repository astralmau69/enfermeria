import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        DNTIC by
        <a href="https://www.cossmil.mil.bo" target="_blank" rel="noopener noreferrer" class="text-primary font-bold hover:underline">COSSMIL</a>
    </div>`
})
export class AppFooter { }
