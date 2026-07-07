// ImportResult.spec.js

import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ImportResult from '../../../../../../assets/vue/components/subscribers/ImportResult.vue'

const BaseIconStub = {
    name: 'BaseIcon',
    props: ['name'],
    template: '<span class="base-icon" />',
}

describe('ImportResult', () => {
    const createWrapper = (props = {}) =>
        mount(ImportResult, {
            props: {
                isImportResultOpen: true,
                importResult: {
                    imported: 10,
                    skipped: 2,
                    errors: [],
                },
                ...props,
            },
            global: {
                stubs: {
                    BaseIcon: BaseIconStub,
                },
            },
        })

    it('renders when open', () => {
        const wrapper = createWrapper()

        expect(wrapper.text()).toContain('Import Result')
    })

    it('does not render when closed', () => {
        const wrapper = createWrapper({
            isImportResultOpen: false,
        })

        expect(wrapper.text()).toBe('')
    })

    it('displays imported and skipped counts', () => {
        const wrapper = createWrapper({
            importResult: {
                imported: 25,
                skipped: 7,
                errors: [],
            },
        })

        expect(wrapper.text()).toContain('Imported')
        expect(wrapper.text()).toContain('25')

        expect(wrapper.text()).toContain('Skipped')
        expect(wrapper.text()).toContain('7')
    })

    it('shows success message when there are no errors', () => {
        const wrapper = createWrapper({
            importResult: {
                imported: 10,
                skipped: 0,
                errors: [],
            },
        })

        expect(wrapper.text()).toContain(
            'Import completed without errors.'
        )
    })

    it('renders error list when errors exist', () => {
        const wrapper = createWrapper({
            importResult: {
                imported: 5,
                skipped: 1,
                errors: [
                    'Invalid email',
                    'Missing name',
                ],
            },
        })

        expect(wrapper.text()).toContain('Errors')
        expect(wrapper.text()).toContain('Invalid email')
        expect(wrapper.text()).toContain('Missing name')
    })

    it('renders one list item per error', () => {
        const wrapper = createWrapper({
            importResult: {
                imported: 5,
                skipped: 1,
                errors: [
                    'Error 1',
                    'Error 2',
                    'Error 3',
                ],
            },
        })

        expect(wrapper.findAll('li'))
            .toHaveLength(3)
    })

    it('emits close when header close button is clicked', async () => {
        const wrapper = createWrapper()

        const buttons = wrapper.findAll('button')

        await buttons[0].trigger('click')

        expect(wrapper.emitted('close'))
            .toHaveLength(1)
    })

    it('emits close when footer close button is clicked', async () => {
        const wrapper = createWrapper()

        const buttons = wrapper.findAll('button')

        await buttons[1].trigger('click')

        expect(wrapper.emitted('close'))
            .toHaveLength(1)
    })

    it('emits close when backdrop is clicked', async () => {
        const wrapper = createWrapper()

        const backdrop = wrapper.find('.fixed.inset-0')

        await backdrop.trigger('click')

        expect(wrapper.emitted('close'))
            .toHaveLength(1)
    })

    it('does not render error section when errors array is empty', () => {
        const wrapper = createWrapper({
            importResult: {
                imported: 1,
                skipped: 0,
                errors: [],
            },
        })

        expect(wrapper.text())
            .not.toContain('Errors')
    })
})
