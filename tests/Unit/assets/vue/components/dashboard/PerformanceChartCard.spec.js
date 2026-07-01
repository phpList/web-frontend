// PerformanceChartCard.spec.js
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import PerformanceChartCard from '../../../../../../assets/vue/components/dashboard/PerformanceChartCard.vue'

vi.mock('vue3-apexcharts', () => ({
    default: {
        name: 'apexchart',
        props: ['type', 'height', 'options', 'series'],
        template: '<div class="apexchart-stub" />',
    },
}))

const BaseCardStub = {
    name: 'BaseCard',
    template: '<div class="base-card"><slot /></div>',
}

describe('PerformanceChartCard', () => {
    const chartData = {
        labels: ['May 1', 'May 2', 'May 3'],
        series: [
            {
                name: 'Opens',
                data: [120, 150, 180],
            },
            {
                name: 'Clicks',
                data: [25, 30, 42],
            },
        ],
    }

    const mountComponent = (props = {}) =>
        mount(PerformanceChartCard, {
            props: {
                chart: chartData,
                ...props,
            },
            global: {
                stubs: {
                    BaseCard: BaseCardStub,
                },
            },
        })

    it('renders card title and description', () => {
        const wrapper = mountComponent()

        expect(wrapper.text()).toContain('Campaign Performance')
        expect(wrapper.text()).toContain(
            'Daily opens and clicks for the last 30 days'
        )
    })

    it('passes chart series to apexchart', () => {
        const wrapper = mountComponent()

        const chart = wrapper.findComponent({ name: 'apexchart' })

        expect(chart.props('series')).toEqual(chartData.series)
    })

    it('passes area chart configuration', () => {
        const wrapper = mountComponent()

        const chart = wrapper.findComponent({ name: 'apexchart' })

        expect(chart.props('type')).toBe('area')
        expect(chart.props('height')).toBe('220')
    })

    it('uses chart labels as x-axis categories', () => {
        const wrapper = mountComponent()

        const chart = wrapper.findComponent({ name: 'apexchart' })
        const options = chart.props('options')

        expect(options.xaxis.categories).toEqual(chartData.labels)
    })

    it('configures expected chart options', () => {
        const wrapper = mountComponent()

        const chart = wrapper.findComponent({ name: 'apexchart' })
        const options = chart.props('options')

        expect(options.chart.toolbar.show).toBe(false)
        expect(options.chart.zoom.enabled).toBe(false)

        expect(options.stroke).toEqual({
            curve: 'smooth',
            width: 2,
        })

        expect(options.colors).toEqual([
            '#10b981',
            '#3b82f6',
        ])

        expect(options.legend.show).toBe(true)
        expect(options.legend.position).toBe('top')
    })

    it('formats y-axis labels correctly', () => {
        const wrapper = mountComponent()

        const chart = wrapper.findComponent({ name: 'apexchart' })
        const formatter =
            chart.props('options').yaxis.labels.formatter

        expect(formatter(1234.4)).toBe('1,234')
        expect(formatter(1234.8)).toBe('1,235')
    })

    it('formats tooltip values correctly', () => {
        const wrapper = mountComponent()

        const chart = wrapper.findComponent({ name: 'apexchart' })
        const formatter =
            chart.props('options').tooltip.y.formatter

        expect(formatter(12345)).toBe('12,345')
    })

    it('falls back to empty arrays when chart data is missing', () => {
        const wrapper = mount(PerformanceChartCard, {
            props: {
                chart: {},
            },
            global: {
                stubs: {
                    BaseCard: BaseCardStub,
                },
            },
        })

        const chart = wrapper.findComponent({ name: 'apexchart' })

        expect(chart.props('series')).toEqual([])
        expect(chart.props('options').xaxis.categories).toEqual([])
    })

    it('reacts to prop changes', async () => {
        const wrapper = mountComponent()

        await wrapper.setProps({
            chart: {
                labels: ['Jun 1'],
                series: [
                    {
                        name: 'Opens',
                        data: [500],
                    },
                ],
            },
        })

        const chart = wrapper.findComponent({ name: 'apexchart' })

        expect(chart.props('series')).toEqual([
            {
                name: 'Opens',
                data: [500],
            },
        ])

        expect(chart.props('options').xaxis.categories).toEqual([
            'Jun 1',
        ])
    })
})
