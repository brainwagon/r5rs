#include <unity.h>

void setUp(void) {}
void tearDown(void) {}

void test_unity_is_working(void) {
    TEST_ASSERT_TRUE(1);
}

int main(void) {
    UNITY_BEGIN();
    RUN_TEST(test_unity_is_working);
    return UNITY_END();
}
