import natural from 'natural';
import { SOS_PRIORITY_OBJ } from '@handy-go/shared';
// Keyword sets for priority assessment
const CRITICAL_KEYWORDS = [
    'attack', 'attacking', 'violence', 'violent', 'weapon', 'knife', 'gun',
    'threat', 'threatening', 'blood', 'bleeding', 'injury', 'injured',
    'police', 'ambulance', 'rape', 'assault', 'murder', 'kill', 'killing',
    'hostage', 'kidnap', 'robbery', 'armed', 'danger', 'life', 'dying', 'dead'
];
const HIGH_KEYWORDS = [
    'harassment', 'harassing', 'aggressive', 'scared', 'unsafe', 'stolen',
    'theft', 'stealing', 'intimidation', 'intimidate', 'follow', 'following',
    'stalking', 'trapped', 'locked', 'hurt', 'pain', 'hit', 'hitting',
    'slap', 'punch', 'abuse', 'verbal', 'physical', 'emergency'
];
const MEDIUM_KEYWORDS = [
    'dispute', 'argument', 'problem', 'issue', 'uncomfortable', 'suspicious',
    'strange', 'weird', 'rude', 'disrespectful', 'unprofessional', 'late',
    'wrong', 'mistake', 'overcharge', 'refuse', 'refusing'
];
// Contextual factors that increase priority
const AGGRAVATING_FACTORS = {
    timeOfDay: {
        lateNight: { start: 22, end: 6 }, // 10 PM to 6 AM
        priorityBoost: 1, // Increase by 1 level
    },
    location: {
        isolatedKeywords: ['alone', 'isolated', 'remote', 'empty', 'dark'],
        priorityBoost: 1,
    },
};
// Create tokenizer
const tokenizer = new natural.WordTokenizer();
/**
 * Assess SOS priority based on description and context
 */
export const assessPriority = (description, context) => {
    const normalizedDesc = description.toLowerCase();
    const tokens = tokenizer.tokenize(normalizedDesc) || [];
    let priorityScore = 0;
    const reasons = [];
    const recommendedActions = [];
    // Check for critical keywords
    const criticalMatches = tokens.filter(token => CRITICAL_KEYWORDS.some(keyword => token.includes(keyword) || keyword.includes(token)));
    if (criticalMatches.length > 0) {
        priorityScore += 3;
        reasons.push(`Critical keywords detected: ${criticalMatches.join(', ')}`);
        recommendedActions.push('Immediate admin intervention required');
        recommendedActions.push('Consider contacting emergency services');
    }
    // Check for high priority keywords
    const highMatches = tokens.filter(token => HIGH_KEYWORDS.some(keyword => token.includes(keyword) || keyword.includes(token)));
    if (highMatches.length > 0) {
        priorityScore += 2;
        reasons.push(`High priority keywords detected: ${highMatches.join(', ')}`);
        recommendedActions.push('Urgent admin attention needed');
    }
    // Check for medium priority keywords
    const mediumMatches = tokens.filter(token => MEDIUM_KEYWORDS.some(keyword => token.includes(keyword) || keyword.includes(token)));
    if (mediumMatches.length > 0) {
        priorityScore += 1;
        reasons.push(`Issue keywords detected: ${mediumMatches.join(', ')}`);
    }
    // Apply contextual factors
    if (context?.timeOfDay) {
        const hour = context.timeOfDay.getHours();
        const { lateNight } = AGGRAVATING_FACTORS.timeOfDay;
        if (hour >= lateNight.start || hour < lateNight.end) {
            priorityScore += 1;
            reasons.push('Late night incident - elevated risk');
            recommendedActions.push('Priority response due to time sensitivity');
        }
    }
    // Check for isolation indicators
    const isolationMatches = tokens.filter(token => AGGRAVATING_FACTORS.location.isolatedKeywords.includes(token));
    if (isolationMatches.length > 0) {
        priorityScore += 1;
        reasons.push(`Isolation indicators: ${isolationMatches.join(', ')}`);
    }
    // Check user history for false alarms
    if (context?.userHistory) {
        const { previousSOS, validSOS } = context.userHistory;
        if (previousSOS > 3 && validSOS / previousSOS < 0.5) {
            priorityScore = Math.max(priorityScore - 1, 0);
            reasons.push('User has history of invalid SOS reports');
        }
    }
    // Determine final priority
    let priority;
    if (priorityScore >= 3) {
        priority = SOS_PRIORITY_OBJ.CRITICAL;
        recommendedActions.push('Notify all available admins immediately');
    }
    else if (priorityScore >= 2) {
        priority = SOS_PRIORITY_OBJ.HIGH;
        recommendedActions.push('Assign to available admin within 2 minutes');
    }
    else if (priorityScore >= 1) {
        priority = SOS_PRIORITY_OBJ.MEDIUM;
        recommendedActions.push('Assign to available admin within 5 minutes');
    }
    else {
        priority = SOS_PRIORITY_OBJ.LOW;
        recommendedActions.push('Queue for admin review');
    }
    // Calculate confidence based on matches found
    const totalMatches = criticalMatches.length + highMatches.length + mediumMatches.length;
    const confidence = Math.min(totalMatches * 0.2 + 0.5, 1.0); // 50% base + 20% per match, max 100%
    // Add default reason if none found
    if (reasons.length === 0) {
        reasons.push('No specific threat indicators detected');
        recommendedActions.push('Standard review process');
    }
    return {
        priority,
        confidence,
        reasons,
        recommendedActions,
    };
};
/**
 * Analyze if SOS seems like a false alarm
 */
export const detectPotentialFalseAlarm = (description, context) => {
    const reasons = [];
    let suspiciousScore = 0;
    const normalizedDesc = description.toLowerCase();
    // Very short descriptions with no keywords
    if (description.length < 10) {
        suspiciousScore += 1;
        reasons.push('Very short description');
    }
    // Test keywords
    const testKeywords = ['test', 'testing', 'try', 'trying', 'check', 'accident', 'mistake', 'sorry'];
    if (testKeywords.some(keyword => normalizedDesc.includes(keyword))) {
        suspiciousScore += 2;
        reasons.push('Possible test or accidental trigger');
    }
    // No active booking context
    if (context?.bookingStatus === 'COMPLETED' || context?.bookingStatus === 'CANCELLED') {
        suspiciousScore += 1;
        reasons.push('SOS triggered after booking completion/cancellation');
    }
    return {
        isSuspicious: suspiciousScore >= 2,
        reasons,
    };
};
export default {
    assessPriority,
    detectPotentialFalseAlarm,
};
//# sourceMappingURL=priority-assessor.js.map