import { Component } from '@angular/core';
import { Hero } from './components/hero/hero';
import { FeaturedListings } from './components/featured-listings/featured-listings';
import { HowItWorks } from './components/how-it-works/how-it-works';
import { TopUniversities } from './components/top-universities/top-universities';
import { Cta } from './components/cta/cta';

@Component({
  selector: 'app-home',
  imports: [Hero, FeaturedListings, HowItWorks, TopUniversities, Cta],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {

}
