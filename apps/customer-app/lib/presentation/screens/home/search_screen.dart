import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../core/constants/app_colors.dart';
import '../../../core/constants/app_spacing.dart';
import '../../../core/routes/app_routes.dart';

/// Search screen for finding services
class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final _searchController = TextEditingController();
  final _focusNode = FocusNode();
  List<SearchResult> _results = [];
  List<String> _recentSearches = [];
  static const _recentSearchesKey = 'recent_searches';

  /// Comprehensive keyword→category mapping for problem-based search
  static const Map<String, List<String>> _problemKeywords = {
    'PLUMBING': [
      'leak',
      'pipe',
      'tap',
      'drain',
      'toilet',
      'water',
      'faucet',
      'bathroom',
      'kitchen sink',
      'geyser',
      'shower',
      'sewage',
      'valve',
      'flush',
      'basin',
      'blockage',
      'clogged',
      'drip',
      'plumber',
    ],
    'ELECTRICAL': [
      'light',
      'switch',
      'fan',
      'wire',
      'socket',
      'short circuit',
      'power',
      'electricity',
      'bulb',
      'fuse',
      'circuit breaker',
      'voltage',
      'inverter',
      'ups',
      'wiring',
      'electrician',
      'plug',
    ],
    'AC_REPAIR': [
      'ac',
      'air conditioner',
      'cool',
      'cooling',
      'hvac',
      'split',
      'compressor',
      'gas refill',
      'refrigerant',
      'thermostat',
      'duct',
      'filter',
      'heating',
    ],
    'CLEANING': [
      'clean',
      'wash',
      'mop',
      'sweep',
      'dust',
      'sanitize',
      'deep clean',
      'carpet',
      'sofa',
      'upholstery',
      'window',
      'floor',
      'house clean',
      'office clean',
      'maid',
    ],
    'CARPENTER': [
      'wood',
      'door',
      'cabinet',
      'shelf',
      'furniture',
      'table',
      'chair',
      'wardrobe',
      'cupboard',
      'drawer',
      'repair furniture',
      'fix door',
      'carpenter',
      'hinge',
      'lock',
    ],
    'PAINTING': [
      'paint',
      'wall',
      'color',
      'whitewash',
      'texture',
      'primer',
      'putty',
      'roller',
      'brush',
      'exterior',
      'interior',
      'ceiling',
      'painter',
    ],
    'MECHANIC': [
      'car',
      'bike',
      'engine',
      'oil',
      'tire',
      'brake',
      'battery',
      'mechanic',
      'vehicle',
      'motorcycle',
      'auto',
      'generator',
      'puncture',
      'dent',
    ],
    'GENERAL_HANDYMAN': [
      'fix',
      'repair',
      'install',
      'mount',
      'hang',
      'assemble',
      'handyman',
      'maintenance',
      'odd job',
      'home repair',
      'general',
    ],
  };

  final List<ServiceSuggestion> _popularServices = [
    ServiceSuggestion(
      name: 'Plumbing',
      category: 'PLUMBING',
      icon: Icons.plumbing,
      color: AppColors.plumbing,
    ),
    ServiceSuggestion(
      name: 'Electrical',
      category: 'ELECTRICAL',
      icon: Icons.electrical_services,
      color: AppColors.electrical,
    ),
    ServiceSuggestion(
      name: 'Cleaning',
      category: 'CLEANING',
      icon: Icons.cleaning_services,
      color: AppColors.cleaning,
    ),
    ServiceSuggestion(
      name: 'AC Repair',
      category: 'AC_REPAIR',
      icon: Icons.ac_unit,
      color: AppColors.acRepair,
    ),
    ServiceSuggestion(
      name: 'Carpenter',
      category: 'CARPENTER',
      icon: Icons.carpenter,
      color: AppColors.carpenter,
    ),
    ServiceSuggestion(
      name: 'Painting',
      category: 'PAINTING',
      icon: Icons.format_paint,
      color: AppColors.painting,
    ),
    ServiceSuggestion(
      name: 'Mechanic',
      category: 'MECHANIC',
      icon: Icons.build,
      color: AppColors.mechanic,
    ),
    ServiceSuggestion(
      name: 'Handyman',
      category: 'GENERAL_HANDYMAN',
      icon: Icons.handyman,
      color: AppColors.handyman,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _focusNode.requestFocus();
    _searchController.addListener(_onSearchChanged);
    _loadRecentSearches();
  }

  Future<void> _loadRecentSearches() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getStringList(_recentSearchesKey);
    if (saved != null && mounted) {
      setState(() => _recentSearches = saved);
    }
  }

  Future<void> _saveRecentSearches() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_recentSearchesKey, _recentSearches);
  }

  @override
  void dispose() {
    _searchController.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _onSearchChanged() {
    final query = _searchController.text.toLowerCase().trim();
    if (query.isEmpty) {
      setState(() => _results = []);
      return;
    }

    final results = <SearchResult>[];
    final addedCategories = <String>{};

    // 1. Match by service name
    for (final service in _popularServices) {
      if (service.name.toLowerCase().contains(query)) {
        results.add(
          SearchResult(
            title: service.name,
            subtitle: 'Service category',
            category: service.category,
            icon: service.icon,
            color: service.color,
          ),
        );
        addedCategories.add(service.category);
      }
    }

    // 2. Match by problem keywords → suggest the category
    for (final entry in _problemKeywords.entries) {
      if (addedCategories.contains(entry.key)) continue;
      for (final keyword in entry.value) {
        if (query.contains(keyword) || keyword.contains(query)) {
          final service = _popularServices.firstWhere(
            (s) => s.category == entry.key,
            orElse: () => _popularServices.last,
          );
          results.add(
            SearchResult(
              title: _problemTitle(entry.key, keyword, query),
              subtitle: service.name,
              category: entry.key,
              icon: service.icon,
              color: service.color,
            ),
          );
          addedCategories.add(entry.key);
          break; // one result per category
        }
      }
    }

    setState(() => _results = results);
  }

  /// Generate a human-friendly problem title
  String _problemTitle(String category, String matchedKeyword, String query) {
    switch (category) {
      case 'PLUMBING':
        return 'Plumbing — ${_capitalize(matchedKeyword)} repair';
      case 'ELECTRICAL':
        return 'Electrical — ${_capitalize(matchedKeyword)} fix';
      case 'AC_REPAIR':
        return 'AC — ${_capitalize(matchedKeyword)} service';
      case 'CLEANING':
        return 'Cleaning — ${_capitalize(matchedKeyword)} service';
      case 'CARPENTER':
        return 'Carpentry — ${_capitalize(matchedKeyword)} work';
      case 'PAINTING':
        return 'Painting — ${_capitalize(matchedKeyword)} job';
      case 'MECHANIC':
        return 'Mechanic — ${_capitalize(matchedKeyword)} repair';
      default:
        return 'Handyman — ${_capitalize(matchedKeyword)}';
    }
  }

  String _capitalize(String s) =>
      s.isEmpty ? s : s[0].toUpperCase() + s.substring(1);

  void _onResultTap(SearchResult result) {
    // Add to recent searches and persist
    if (!_recentSearches.contains(result.title)) {
      _recentSearches.insert(0, result.title);
      if (_recentSearches.length > 5) {
        _recentSearches.removeLast();
      }
      _saveRecentSearches();
    }

    // Navigate to service selection
    Navigator.of(context).pushNamed(
      AppRoutes.serviceSelection,
      arguments: {'category': result.category},
    );
  }

  void _onServiceTap(ServiceSuggestion service) {
    Navigator.of(context).pushNamed(
      AppRoutes.serviceSelection,
      arguments: {'category': service.category},
    );
  }

  void _clearRecentSearch(String search) {
    setState(() {
      _recentSearches.remove(search);
    });
    _saveRecentSearches();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: colorScheme.surface,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: colorScheme.onSurface),
          onPressed: () => Navigator.pop(context),
        ),
        title: TextField(
          controller: _searchController,
          focusNode: _focusNode,
          decoration: InputDecoration(
            hintText: 'Search for services...',
            border: InputBorder.none,
            hintStyle: TextStyle(
              color: colorScheme.onSurface.withValues(alpha: 0.5),
            ),
          ),
          style: const TextStyle(fontSize: 16),
        ),
        actions: [
          if (_searchController.text.isNotEmpty)
            IconButton(
              icon: Icon(
                Icons.clear,
                color: colorScheme.onSurface.withValues(alpha: 0.7),
              ),
              onPressed: () {
                _searchController.clear();
                setState(() => _results = []);
              },
            ),
        ],
      ),
      body: _searchController.text.isEmpty
          ? _buildInitialContent()
          : _buildSearchResults(),
    );
  }

  Widget _buildInitialContent() {
    final colorScheme = Theme.of(context).colorScheme;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Recent searches
          if (_recentSearches.isNotEmpty) ...[
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Recent Searches',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: colorScheme.onSurface,
                  ),
                ),
                TextButton(
                  onPressed: () {
                    setState(() => _recentSearches.clear());
                    _saveRecentSearches();
                  },
                  child: const Text('Clear all'),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Wrap(
              spacing: AppSpacing.sm,
              runSpacing: AppSpacing.sm,
              children: _recentSearches.map((search) {
                return Chip(
                  label: Text(search),
                  deleteIcon: const Icon(Icons.close, size: 16),
                  onDeleted: () => _clearRecentSearch(search),
                  backgroundColor: colorScheme.surface,
                );
              }).toList(),
            ),
            const SizedBox(height: AppSpacing.lg),
          ],

          // Popular services
          Text(
            'Popular Services',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 4,
              mainAxisSpacing: AppSpacing.md,
              crossAxisSpacing: AppSpacing.md,
              childAspectRatio: 0.85,
            ),
            itemCount: _popularServices.length,
            itemBuilder: (context, index) {
              final service = _popularServices[index];
              return _buildServiceCard(service);
            },
          ),
        ],
      ),
    );
  }

  Widget _buildServiceCard(ServiceSuggestion service) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    return GestureDetector(
      onTap: () => _onServiceTap(service),
      child: Container(
        decoration: BoxDecoration(
          color: colorScheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          boxShadow: [
            BoxShadow(
              color: theme.shadowColor.withValues(alpha: 0.1),
              blurRadius: 5,
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.sm),
              decoration: BoxDecoration(
                color: service.color.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
              ),
              child: Icon(service.icon, color: service.color, size: 24),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              service.name,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: colorScheme.onSurface,
              ),
              textAlign: TextAlign.center,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchResults() {
    final colorScheme = Theme.of(context).colorScheme;
    if (_results.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.search_off,
              size: 64,
              color: colorScheme.onSurface.withValues(alpha: 0.5),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              'No services found',
              style: TextStyle(
                fontSize: 16,
                color: colorScheme.onSurface.withValues(alpha: 0.7),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Try a different search term',
              style: TextStyle(
                fontSize: 14,
                color: colorScheme.onSurface.withValues(alpha: 0.5),
              ),
            ),
          ],
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.all(AppSpacing.md),
      itemCount: _results.length,
      separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.sm),
      itemBuilder: (context, index) {
        final result = _results[index];
        return _buildResultCard(result);
      },
    );
  }

  Widget _buildResultCard(SearchResult result) {
    return ListTile(
      onTap: () => _onResultTap(result),
      leading: Container(
        padding: const EdgeInsets.all(AppSpacing.sm),
        decoration: BoxDecoration(
          color: result.color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        child: Icon(result.icon, color: result.color),
      ),
      title: Text(
        result.title,
        style: const TextStyle(fontWeight: FontWeight.w500),
      ),
      subtitle: Text(result.subtitle),
      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      tileColor: Theme.of(context).colorScheme.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
    );
  }
}

class SearchResult {
  final String title;
  final String subtitle;
  final String category;
  final IconData icon;
  final Color color;

  SearchResult({
    required this.title,
    required this.subtitle,
    required this.category,
    required this.icon,
    required this.color,
  });
}

class ServiceSuggestion {
  final String name;
  final String category;
  final IconData icon;
  final Color color;

  ServiceSuggestion({
    required this.name,
    required this.category,
    required this.icon,
    required this.color,
  });
}
