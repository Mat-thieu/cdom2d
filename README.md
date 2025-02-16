# Cdom2d

_Note this library is far from production ready, or done, it's actively being worked on_

Cdom2d is a lightweight zero-dependency canvas DOM library and (soon to be) layout engine written in Typescript. It is designed to provide a minimum set of features you need for working with layering while maintaining a small bundle size.

The focus of this library is to provide a minimum viable set of tools for drawing using the canvas 2d feature set, it does not attempt to fill in shortcomings of the API as it would impede on the bundle size, however I do strive for it to be extensible enough so these shortcomings can be resolved.

## Features and planned features

- [x] Canvas pan
- [x] Canvas zoom
- [x] Layering
  - [x] Grouping
  - [x] Rect
  - [x] Text (partial, font load listener missing)
  - [x] Image (very basic)
- [x] Click and hit detection
- [x] Indexing
- [x] Computed units
  - [x] Percentage
  - [x] Viewport width and height
- [ ] Movable bounding box (may be moved into its own repo)
- [ ] Serializable 
- [ ] Layout
  - [x] Padding
  - [x] Margin
  - [ ] Inline
  - [ ] Block
- [ ] Animation
  - [ ] Global timeline mode
  - [ ] Interactivity response mode
- [ ] Caching
- [ ] Testing
