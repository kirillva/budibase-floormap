def linear_fit(x: list[float], y: list[float]) -> tuple[float, float]:
    n = len(x)
    s1, s2 = sum(x), sum(y)
    s3 = sum(item ** 2 for item in x)
    s4 = sum(item1 * item2 for item1, item2 in zip(x, y))
    a0 = (s2 * s3 - s1 * s4) / (n * s3 - s1 ** 2)
    a1 = (n * s4 - s1 * s2) / (n * s3 - s1 ** 2)
    return a0, a1


def line(x: float, a0: float, a1: float) -> float: # уравнение прямой
    return a0 + a1 * x


x = [300, 400, 500, 600, 700, 800]
y = [6.97, 7.01, 7.12, 7.28, 7.45, 7.62]

linear_params = linear_fit(x, y)
cp = line(750, *linear_params)


# x - x_arr[i] ** 2 + x - y_arr[i] ** 2 + x - z_arr[i] ** 2 = dist_arr[i] ** 2