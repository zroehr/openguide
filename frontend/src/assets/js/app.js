/*
 OpenStax Style Guide
*/
'use strict';

import riot from 'riot';
import route from 'riot-route';
import scrollToY from './scrollTo.js';
import './tags.js';
import './interactions.js';

class AbstractDataModel {
  constructor(request) {
    riot.observable(this);

    // This request is made asynchronously in the <head>
    // of the main html chunk in order to load JSON data quickly.
    json_request.then((data, xhr) => { this.setModelData(data) },          // success
                      (data, xhr) => { console.error(data, xhr.status) }); // error
  }

  setModelData(data) {
    this.data = data['Section'];
    let newArray = this.data;

    for (var key in newArray) {
      newArray[key].id = key;
      newArray[key].Name = newArray[key]["!text"].split('</h1>')[0].replace(/<h1>/g,"");
      newArray[key].description = newArray[key]["!text"].split('</h1>')[1];
      newArray[key].Number = newArray[key].Number.replace(/'/g,"");
      delete newArray[key]["!text"];

      if (newArray[key].Number.endsWith('.0.0')) {
        newArray[key].Category = newArray[key].Name;
      } else {
        let newKey = key;

        do {
          newKey--;

          if (newArray[newKey].Number.endsWith('.0.0')) {
            newArray[key].Category = newArray[newKey].Name;
          }
        }
        while (!newArray[newKey].Number.endsWith('.0.0'));
      }
    }

    this.data = newArray;
    this.trigger('updated', this.data);
  }

  setItem(idx, val) {
    this.data[idx] = val;
  }

  getItem(idx) {
    return this.data[idx];
  }
}

class StyleGuideApp {
  constructor() {
    riot.observable(this);

    this.model = new AbstractDataModel(json_request); // json_request is global.
  }
}

let app = new StyleGuideApp();

// Clean this up.
// window.riot = riot;
// window.app = app;

let r = route.create();
r('/', home)
r('*/*', detail)
r('*/*/#*', heading)
r(notfound)

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}

function home() {
  route('getting-started/background');
  window.scrollTo(0,0);
}

function goToSection(category, id) {
  if (app.model.data != undefined) {
    let selected = app.model.data.filter(function(d) { return d.Name.replace(/ +/g, '-').toLowerCase() == id })[0] || {}

    if(isEmpty(selected)) {
      selected = {Name:'404 Not Found', description: 'Nothing to see here.' };
    }

    riot.mount('#section','style-guide-sections', selected);
  } else {
    app.model.on('updated', function(data) {
      let selected = data.filter(function(d) { return d.Name.replace(/ +/g, '-').toLowerCase() == id })[0] || {}

      if(isEmpty(selected)) {
        selected = {Name:'404 Not Found', description: 'Nothing to see here.' };
      }

      riot.mount('#section','style-guide-sections', selected);
    });
  }
}

function detail(category, id) {
  goToSection(category, id);
  window.scrollTo(0,0);
}

function heading(category, id, heading) {
  goToSection(category, id);

  setTimeout(function(){
    let el = document.getElementById(heading);

    if (el) {
      let rect = el.getBoundingClientRect();
      scrollToY(rect.top, 2000, 'easeInOutQuint');
    }
  }, 500);
}

function notfound() {
  let selected = {Name:'404 Not Found', description: 'Nothing to see here.' };

  riot.mount('#section','style-guide-sections', selected);
}

riot.mount('style-guide', app);
route.base('/#/');
route.stop();
route.start(true);