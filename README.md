# Cdom2d

_Note this library is far from production ready, or done, it's actively being worked on_

Cdom2d is a lightweight canvas DOM library and layout engine  written in Typscript. It is designed to provide a minimum set of features you need for working with layering while maintaining a small bundle size.

The focus of this library is to provide a minimum viable set of tools for drawing using the canvas 2d feature set, it does not attempt to fill in shortcomings of the API as it would impede on the bundle size, however I do strive for it to be extensible enough so these shortcomings can be resolved.

## Features and planned features

- [x] Layering
  - [x] Grouping
  - [x] Rect
  - [ ] Text
  - [ ] Image
  - [ ] Video
- [x] Click and hit detection
- [x] Indexing
- [x] Computed units
  - [x] Percentage
  - [x] Viewport width and height
- [ ] Movable bounding box (may be moved into its own repo)
- [ ] Serializable 
- [ ] Layout
  - [ ] Inline
  - [ ] Block
- [ ] Animation
- [ ] Caching
- [ ] Testing