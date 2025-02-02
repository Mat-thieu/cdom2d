export default function pointInPoly(x, y, poly) {
    let c = false;
    for (let l = poly.length, i = 0, j = l-1; i < l; j = i++) {
        let xj = poly[j].x, yj = poly[j].y, xi = poly[i].x, yi = poly[i].y;
        let where = (yi - yj) * (x - xi) - (xi - xj) * (y - yi);
        if (yj < yi) {
            if (y >= yj && y < yi) {
                if (where == 0) return true;    // point on the line
                if (where > 0) {
                    if (y == yj) {                // ray intersects vertex
                        if (y > poly[j == 0 ? l-1 : j-1].y) {
                            c = !c;
                        }
                    } else {
                        c = !c;
                    }
                }
            }
        } else if (yi < yj) {
            if (y > yi && y <= yj) {
                if (where == 0) return true;    // point on the line
                if (where < 0) {
                    if (y == yj) {                // ray intersects vertex
                        if (y < poly[j == 0 ? l-1 : j-1].y) {
                            c = !c;
                        }
                    } else {
                        c = !c;
                    }
                }
            }
        } else if (y == yi && (x >= xj && x <= xi || x >= xi && x <= xj)) {
            return true;     // point on horizontal edge
        }
    }
    return c;
}