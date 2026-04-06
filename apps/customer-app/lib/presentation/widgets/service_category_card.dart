import 'package:flutter/material.dart';

/// Service category model
class ServiceCategory {
  final String name;
  final IconData icon;
  final String? imagePath;
  final Color color;
  final String route;
  final List<String> tags;

  const ServiceCategory({
    required this.name,
    required this.icon,
    this.imagePath,
    required this.color,
    required this.route,
    this.tags = const ['RESIDENTIAL', 'COMMERCIAL'],
  });
}

/// Service category card widget
class ServiceCategoryCard extends StatelessWidget {
  final ServiceCategory category;
  final VoidCallback onTap;

  const ServiceCategoryCard({
    super.key,
    required this.category,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFFF2F3F5),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white, width: 2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 15,
              offset: const Offset(0, 5),
            ),
          ],
        ),
        clipBehavior: Clip.hardEdge,
        child: Stack(
          children: [
            // Centered bottom 3D Image or Icon
            Positioned.fill(
              child: Align(
                alignment: Alignment.bottomCenter,
                child: Padding(
                  padding: const EdgeInsets.only(
                    bottom: 15,
                  ), // Give some margin from bottom
                  child: category.imagePath != null
                      ? Image.asset(
                          category.imagePath!,
                          width: 105,
                          height: 105,
                          fit: BoxFit.contain,
                          // Multiply blend mode blends the white background of the image into the card's color
                          color: const Color(0xFFF2F3F5),
                          colorBlendMode: BlendMode.multiply,
                          errorBuilder: (context, error, stackTrace) {
                            return Icon(
                              category.icon,
                              size: 90,
                              color: category.color.withValues(alpha: 0.8),
                            );
                          },
                        )
                      : Icon(
                          category.icon,
                          size: 90,
                          color: category.color.withValues(alpha: 0.8),
                        ),
                ),
              ),
            ),

            // Text and pills content
            Padding(
              padding: const EdgeInsets.all(12.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    category.name,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Colors.black87,
                      height: 1.1,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 4,
                    runSpacing: 4,
                    children: category.tags.map((tag) {
                      // Use red color for females only as per image examples
                      final isFemaleOnly = tag == 'FEMALES ONLY';
                      return Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 6,
                          vertical: 2,
                        ),
                        decoration: BoxDecoration(
                          color: isFemaleOnly
                              ? Colors.red.shade400
                              : Colors.indigo.shade600,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          tag,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 8,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
