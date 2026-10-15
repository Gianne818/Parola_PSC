"""Preference contract checks only: no database, HTTP, Auth or SMS calls."""
import sys
import unittest
from datetime import time
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from pydantic import ValidationError
from schemas import AdvisoryPreferences, UserResponse


class AdvisoryPreferencesTests(unittest.TestCase):
    def test_defaults_pause_routine_advisories(self):
        preferences = AdvisoryPreferences()
        self.assertEqual(preferences.advisory_days, [])
        self.assertEqual(preferences.preferred_advisory_time, time(5, 0))
        self.assertEqual(preferences.preferred_language, 'en')
        self.assertEqual(preferences.habitat_preference, 'both')

    def test_valid_values_round_trip_in_profile_response(self):
        profile = UserResponse(
            id='11111111-1111-4111-8111-111111111111', phone_number='+639171234567',
            full_name='Test', home_port_name='Test port', latitude=0, longitude=0, is_active=True,
            advisory_days=[5, 3, 1, 4, 2], preferred_advisory_time='04:30:15',
            preferred_language='ceb', habitat_preference='demersal',
        )
        saved = profile.model_dump(mode='json')
        self.assertEqual(saved['advisory_days'], [1, 2, 3, 4, 5])
        self.assertEqual(saved['preferred_advisory_time'], '04:30:15')
        self.assertEqual(UserResponse.model_validate(saved), profile)

    def test_rejects_invalid_weekdays(self):
        for days in (None, '1,2', {}, [1, 1], [1, 2, 3, 4, 5, 6], [0], [8], [-1], [1.5], ['1'], [True], [None], [[1, 2]]):
            with self.subTest(days=days), self.assertRaises(ValidationError):
                AdvisoryPreferences(advisory_days=days)

    def test_rejects_invalid_time_language_and_habitat(self):
        invalid = [
            *({'preferred_advisory_time': value} for value in ('04:30+08:00', '04:30:00.5', '4:30', '24:00', '05:60', 18000, True, None)),
            {'preferred_language': None}, {'preferred_language': 'EN'}, {'habitat_preference': 'reef'}, {'habitat_preference': None},
        ]
        for fields in invalid:
            with self.subTest(fields=fields), self.assertRaises(ValidationError):
                AdvisoryPreferences(**fields)


if __name__ == '__main__':
    unittest.main()
