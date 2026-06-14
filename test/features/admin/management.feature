Feature: Admin booking management
  As an administrator I want to search, inspect, and reschedule bookings
  so that I can manage customer appointments.

  Scenario: Admin filters bookings by status and customer email
    Given a confirmed booking exists for admin management
    And I am authenticated as admin
    When I open the admin bookings page
    And I filter admin bookings by confirmed status and that customer email
    Then the admin booking list includes that customer
    When I filter admin bookings by cancelled status and that customer email
    Then the admin booking list excludes that customer

  Scenario: Admin opens booking detail
    Given a confirmed booking exists for admin management
    And I am authenticated as admin
    When I open the admin bookings page
    And I filter admin bookings by confirmed status and that customer email
    And I open that customer's admin booking detail
    Then the admin booking detail shows the customer, service, payment, token, and requests
