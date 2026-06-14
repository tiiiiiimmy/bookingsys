Feature: Admin login
  As an administrator I want to sign in
  so that I can manage bookings.

  @smoke
  Scenario: Admin signs in with valid credentials
    Given I am on the admin login page
    When I sign in as the seeded admin
    Then I land on the admin bookings page

  Scenario: Admin sign-in fails with wrong password
    Given I am on the admin login page
    When I sign in with email "admin@massage.com" and password "wrong-password"
    Then I see an admin login error
