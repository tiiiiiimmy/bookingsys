Feature: Admin session
  As an administrator with a valid session
  I want admin pages to load without re-entering credentials
  so that admin-feature tests can skip the login step.

  @smoke
  Scenario: Seeded admin lands directly on bookings
    Given I am authenticated as admin
    When I open the admin bookings page
    Then I land on the admin bookings page
