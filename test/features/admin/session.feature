Feature: Admin session
  As an administrator with a valid session
  I want admin pages to load without re-entering credentials
  so that admin-feature tests can skip the login step.

  @smoke
  Scenario: Seeded admin lands directly on bookings
    Given I am authenticated as admin
    When I open the admin bookings page
    Then I land on the admin bookings page

  Scenario: Protected admin route redirects anonymous users
    Given I am not authenticated as admin
    When I open the admin bookings page
    Then I am redirected to the admin login page

  Scenario: Expired access token refreshes and keeps the admin on bookings
    Given I have a valid admin session with an expired access token
    When I open the admin bookings page
    Then I land on the admin bookings page
    And the admin access token has been refreshed

  Scenario: Invalid refresh token redirects to login
    Given I have invalid admin tokens
    When I open the admin bookings page
    Then I am redirected to the admin login page
    And admin tokens are cleared

  Scenario: Logging out in one tab invalidates another tab
    Given I have two authenticated admin tabs
    When I log out in the first admin tab
    And I use the second admin tab
    Then the second admin tab is redirected to the admin login page
