Feature: Place a product order
  As a customer I want to order a product and pay
  so that my order is marked paid.

  @smoke
  Scenario: Customer orders a product and payment succeeds
    Given I am on the product order page for "White Magic"
    When I enter my order details
    And I submit the order
    And the order payment succeeds
    Then I see the order marked paid
    And the order is paid in the database

  Scenario Outline: Customer orders each product and payment succeeds
    Given I am on the product order page for "<product>"
    When I enter my order details
    And I submit the order
    And the order payment succeeds
    Then I see the order marked paid
    And the order is paid in the database

    Examples:
      | product     |
      | White Magic |
      | Love Spell  |
      | Money Spell |

  Scenario: Unknown product does not create an order
    Given I am on the product order page for "Nope"
    Then I see the product not found message
    And no product order is created for the customer

  Scenario: Failed product payment remains pending
    Given I am on the product order page for "White Magic"
    When I enter my order details
    And I submit the order
    And the order payment fails
    Then I see the order still processing
    And the product order is pending in the database

  Scenario: Product order without a payment webhook remains pending
    Given I am on the product order page for "White Magic"
    When I enter my order details
    And I submit the order
    Then I see the order still processing
    And the product order is pending in the database
