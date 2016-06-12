# tinycolorpick

A tiny color picker, intentionally reduced and based on Rachel Carvalho´s [simple-color-picker](http://rachel-carvalho.github.io/simple-color-picker/), with slight modifications.

E.g., by default the colors you can choose from is intentionally limited and has an opacity setting of 0.6.

Sample on [Spitfire](http://spitfire.peewee.space/tinycolorpick).

## Installation

```
$ meteor add ulfeed:tinycolorpick
```

## Usage

Include it in your html template code with

```
{{> tinyColorPick }}
```

Whenever a new color has been picked by the user, a `pick` event can be catched inside of your JavaScript template event handler.
The payload of the event is the picked color.

```
Template.yourTemplate.events({
    "pick": function(event) {
         var color = event.color; //color as hex string, e.g. #fafad2
         ...
         Meteor.tinyColorPick.setColor(color); //set background of pick symbol
         }
    });
```

Set the initial color of the pick symbol with

```
Meteor.tinyColorPick.setColor(color); //color as hex string, e.g. #fafad2
```


## Options

Configure with

```
Meteor.tinyColorPick.setOptions(options);
```

The following properties are the default settings

 ```
 var options = {
    opacity: .6,
    colors:  ['#000000', '#999999', '#ffffff',
              '#006600', '#66cc00', '#ccff99',
              '#990000', '#ff3300', '#ff9900',
              '#003399', '#0066cc', '#99ccff',
              '#999900', '#eeee00', '#ffff99'],
    colorsPerLine: 3
    };
 ```


