# Assumptions - KAZENTO Cable Vector

- Date: 2026-05-07
- Unit: millimeters

## Registered Assumptions

- Base corner radius applies to the XY outline only in the first CAD pass.
- Magnet pockets are blind holes from the underside of the base.
- Straight guide is centered on the base.
- First version prioritizes function over decorative styling.
- First generated CAD pass creates `magnetic_base_core`, `straight_cable_guide`, and `snap_cover`.
- `angled_redirection_module` and `multi_cable_channel_module` are specified as required modules but can be modeled after the base interface is tested.
- PETG or PLA+ are recommended until mechanical test results require a different material.

## Magnet Pocket Plan

- Magnet size: 6 mm diameter x 2 mm height.
- Magnet pocket: 6.2 mm diameter x 2.2 mm depth.
- Clearance: 0.20 mm on diameter and depth.
- Quantity: 4.
- Placement: two pockets near each end of the base, mirrored across the centerline.

## Pending User Decisions

- Confirm whether magnets are press-fit, glued, or covered by a printed plug.
- Confirm cable diameter range.
- Confirm desired angle for `angled_redirection_module`.
- Confirm number of channels for `multi_cable_channel_module`.
