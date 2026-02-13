import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

type ServiceBrief = {
  clientName: string
  email: string
  firm: string
  portfolioSize: number
  mandateType: 'discretionary' | 'advisory' | 'execution-only'
  riskProfile: 'conservative' | 'moderate' | 'aggressive'
  investmentHorizon: 'short' | 'medium' | 'long'
  assetClass: 'equities' | 'fixed-income' | 'alternatives' | 'multi-asset'
  instrument: string
  notes: string
}

type Instrument = {
  id: string
  name: string
  ticker: string
}

const fetchServiceBrief = async () => {
  const response = await fetch('/api/services/brief')
  if (!response.ok) throw new Error('Unable to load service brief')
  return (await response.json()) as { data: ServiceBrief }
}

const fetchInstruments = async (assetClass: string) => {
  const response = await fetch(`/api/services/instruments?assetClass=${assetClass}`)
  if (!response.ok) throw new Error('Unable to load instruments')
  return (await response.json()) as { data: Instrument[] }
}

export default function ServicesPage() {
  const servicesSchema = z.object({
    clientName: z.string().min(1, 'Client name is required'),
    email: z.string().email('Invalid email address'),
    firm: z.string().min(1, 'Firm name is required'),
    portfolioSize: z.string().min(1, 'Portfolio size is required'),
    mandateType: z.enum(['discretionary', 'advisory', 'execution-only'], 'Select a mandate type'),
    riskProfile: z.enum(['conservative', 'moderate', 'aggressive'], 'Select a risk profile'),
    investmentHorizon: z.enum(['short', 'medium', 'long'], 'Select investment horizon'),
    assetClass: z.enum(['equities', 'fixed-income', 'alternatives', 'multi-asset'], 'Select an asset class'),
    instrument: z.string().min(1, 'Select an instrument'),
    notes: z.string().max(500, 'Notes must be 500 characters or less').optional(),
  })

  type ServicesFormValues = z.infer<typeof servicesSchema>

  const briefQuery = useQuery({
    queryKey: ['service-brief'],
    queryFn: fetchServiceBrief,
    initialData: { data: {} as ServiceBrief },
  })

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ServicesFormValues>({
    resolver: zodResolver(servicesSchema),
    defaultValues: {
      clientName: '',
      email: '',
      firm: '',
      portfolioSize: '0',
      mandateType: undefined,
      riskProfile: undefined,
      investmentHorizon: undefined,
      assetClass: undefined,
      instrument: '',
      notes: undefined,
    },
  })

  const assetClass = useWatch({ control, name: 'assetClass' })
  const clientName = useWatch({ control, name: 'clientName' })
  const email = useWatch({ control, name: 'email' })

  const instrumentsQuery = useQuery({
    queryKey: ['service-instruments'],
    queryFn: () => fetchInstruments(assetClass!),
  })

  useEffect(() => {
    if (briefQuery.data?.data) {
      reset({
        clientName: briefQuery.data.data.clientName,
        firm: briefQuery.data.data.firm,
        portfolioSize: String(briefQuery.data.data.portfolioSize),
      })
    }
  })

  const onSubmit = (data: ServicesFormValues) => {
    console.log('Form submitted:', data)
  }

  const instruments = instrumentsQuery.data?.data ?? []
  const brief = briefQuery.data?.data

  return (
    <section className="services-layout">
      <div className="services-intro">
        <p className="eyebrow">Advisory services</p>
        <h1>Open a mandate with us.</h1>
        <p className="lead">
          Configure your portfolio strategy and investment preferences. Our team will
          reach out within one business day to finalize the engagement.
        </p>
        <p className="lead">Current client: {clientName || 'Unknown'} ({email || 'no email'})</p>
        <div className="market-summary">
          <div className="summary-tile">
            <p className="panel-label">AUM</p>
            <p className="summary-metric">$4.2B</p>
          </div>
          <div className="summary-tile">
            <p className="panel-label">Clients</p>
            <p className="summary-metric">1,847</p>
          </div>
          <div className="summary-tile">
            <p className="panel-label">Avg. return</p>
            <p className="summary-metric">+12.4%</p>
          </div>
        </div>
      </div>
      <div className="services-form-card">
        {briefQuery.isLoading ? (
          <div className="form-loading">
            <p className="panel-label">Loading</p>
            <h3>Fetching your profile...</h3>
          </div>
        ) : briefQuery.isError ? (
          <form onSubmit={handleSubmit(onSubmit)} className="services-form">
            <div className="form-header">
              <div>
                <p className="panel-label">Mandate setup</p>
                <h2>Client onboarding</h2>
              </div>
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="clientName">Client name</label>
                <input
                  id="clientName"
                  type="text"
                  {...register('clientName')}
                  className={errors.clientName && !isSubmitting ? 'error' : ''}
                />
                {errors.clientName && !isSubmitting && (
                  <p className="error-text">{errors.clientName.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={errors.email && !isSubmitting ? 'error' : ''}
                />
                {errors.email && !isSubmitting && (
                  <p className="error-text">{errors.email.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="firm">Firm</label>
                <input
                  id="firm"
                  type="text"
                  {...register('firm')}
                  className={errors.firm && !isSubmitting ? 'error' : ''}
                />
                {errors.firm && !isSubmitting && (
                  <p className="error-text">{errors.firm.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="portfolioSize">Portfolio size (USD)</label>
                <input
                  id="portfolioSize"
                  type="text"
                  {...register('portfolioSize')}
                  className={errors.portfolioSize && !isSubmitting ? 'error' : ''}
                />
                {errors.portfolioSize && !isSubmitting && (
                  <p className="error-text">{errors.portfolioSize.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="mandateType">Mandate type</label>
                <select
                  id="mandateType"
                  {...register('mandateType')}
                  className={errors.mandateType && !isSubmitting ? 'error' : ''}
                >
                  <option value="">Select mandate</option>
                  <option value="discretionary">Discretionary</option>
                  <option value="advisory">Advisory</option>
                  <option value="execution-only">Execution only</option>
                </select>
                {errors.mandateType && !isSubmitting && (
                  <p className="error-text">{errors.mandateType.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="riskProfile">Risk profile</label>
                <select
                  id="riskProfile"
                  {...register('riskProfile')}
                  className={errors.riskProfile && !isSubmitting ? 'error' : ''}
                >
                  <option value="">Select risk</option>
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
                {errors.riskProfile && !isSubmitting && (
                  <p className="error-text">{errors.riskProfile.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="investmentHorizon">Investment horizon</label>
                <select
                  id="investmentHorizon"
                  {...register('investmentHorizon')}
                  className={errors.investmentHorizon && !isSubmitting ? 'error' : ''}
                >
                  <option value="">Select horizon</option>
                  <option value="short">Short (0-3 years)</option>
                  <option value="medium">Medium (3-7 years)</option>
                  <option value="long">Long (7+ years)</option>
                </select>
                {errors.investmentHorizon && !isSubmitting && (
                  <p className="error-text">{errors.investmentHorizon.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="assetClass">Asset class</label>
                <select
                  id="assetClass"
                  {...register('assetClass')}
                  className={errors.assetClass && !isSubmitting ? 'error' : ''}
                >
                  <option value="">Select asset class</option>
                  <option value="equities">Equities</option>
                  <option value="fixed-income">Fixed income</option>
                  <option value="alternatives">Alternatives</option>
                  <option value="multi-asset">Multi-asset</option>
                </select>
                {errors.assetClass && !isSubmitting && (
                  <p className="error-text">{errors.assetClass.message}</p>
                )}
              </div>
              <div className="form-group full-width">
                <label htmlFor="instrument">Instrument</label>
                <select
                  id="instrument"
                  {...register('instrument')}
                  disabled={instrumentsQuery.isFetching}
                  className={errors.instrument && !isSubmitting ? 'error' : ''}
                >
                  <option value="">
                    {instrumentsQuery.isFetching ? 'Loading...' : 'Select instrument'}
                  </option>
                  {instruments.map((inst, index) => (
                    <option key={index} value={inst.name}>
                      {inst.name} ({inst.ticker})
                    </option>
                  ))}
                </select>
                {errors.instrument && !isSubmitting && (
                  <p className="error-text">{errors.instrument.message}</p>
                )}
              </div>
              <div className="form-group full-width">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea
                  id="notes"
                  rows={3}
                  {...register('notes')}
                  className={errors.notes && !isSubmitting ? 'error' : ''}
                />
                {errors.notes && !isSubmitting && (
                  <p className="error-text">{errors.notes.message}</p>
                )}
              </div>
            </div>
            <div className="form-actions">
              <button 
                type="submit" 
                className="primary-btn" 
                disabled={isSubmitting || instrumentsQuery.isFetching}
              >
                {isSubmitting ? 'Submitting...' : 'Submit mandate'}
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => briefQuery.data && reset(briefQuery.data.data as unknown as ServicesFormValues)}
              >
                Reset
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="services-form">
            <div className="form-header">
              <div>
                <p className="panel-label">Mandate setup</p>
                <h2>Client onboarding</h2>
              </div>
              {brief && (
                <p className="form-prefill">
                  Prefilled from your saved profile
                </p>
              )}
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label htmlFor="clientName">Client name</label>
                <input
                  id="clientName"
                  type="text"
                  {...register('clientName')}
                  className={errors.clientName && !isSubmitting ? 'error' : ''}
                />
                {errors.clientName && !isSubmitting && (
                  <p className="error-text">{errors.clientName.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  type="email"
                  {...register('email')}
                  className={errors.email && !isSubmitting ? 'error' : ''}
                />
                {errors.email && !isSubmitting && (
                  <p className="error-text">{errors.email.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="firm">Firm</label>
                <input
                  id="firm"
                  type="text"
                  {...register('firm')}
                  className={errors.firm && !isSubmitting ? 'error' : ''}
                />
                {errors.firm && !isSubmitting && (
                  <p className="error-text">{errors.firm.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="portfolioSize">Portfolio size (USD)</label>
                <input
                  id="portfolioSize"
                  type="text"
                  {...register('portfolioSize')}
                  className={errors.portfolioSize && !isSubmitting ? 'error' : ''}
                />
                {errors.portfolioSize && !isSubmitting && (
                  <p className="error-text">{errors.portfolioSize.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="mandateType">Mandate type</label>
                <select
                  id="mandateType"
                  {...register('mandateType')}
                  className={errors.mandateType && !isSubmitting ? 'error' : ''}
                >
                  <option value="">Select mandate</option>
                  <option value="discretionary">Discretionary</option>
                  <option value="advisory">Advisory</option>
                  <option value="execution-only">Execution only</option>
                </select>
                {errors.mandateType && !isSubmitting && (
                  <p className="error-text">{errors.mandateType.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="riskProfile">Risk profile</label>
                <select
                  id="riskProfile"
                  {...register('riskProfile')}
                  className={errors.riskProfile && !isSubmitting ? 'error' : ''}
                >
                  <option value="">Select risk</option>
                  <option value="conservative">Conservative</option>
                  <option value="moderate">Moderate</option>
                  <option value="aggressive">Aggressive</option>
                </select>
                {errors.riskProfile && !isSubmitting && (
                  <p className="error-text">{errors.riskProfile.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="investmentHorizon">Investment horizon</label>
                <select
                  id="investmentHorizon"
                  {...register('investmentHorizon')}
                  className={errors.investmentHorizon && !isSubmitting ? 'error' : ''}
                >
                  <option value="">Select horizon</option>
                  <option value="short">Short (0-3 years)</option>
                  <option value="medium">Medium (3-7 years)</option>
                  <option value="long">Long (7+ years)</option>
                </select>
                {errors.investmentHorizon && !isSubmitting && (
                  <p className="error-text">{errors.investmentHorizon.message}</p>
                )}
              </div>
              <div className="form-group">
                <label htmlFor="assetClass">Asset class</label>
                <select
                  id="assetClass"
                  {...register('assetClass')}
                  className={errors.assetClass && !isSubmitting ? 'error' : ''}
                >
                  <option value="">Select asset class</option>
                  <option value="equities">Equities</option>
                  <option value="fixed-income">Fixed income</option>
                  <option value="alternatives">Alternatives</option>
                  <option value="multi-asset">Multi-asset</option>
                </select>
                {errors.assetClass && !isSubmitting && (
                  <p className="error-text">{errors.assetClass.message}</p>
                )}
              </div>
              <div className="form-group full-width">
                <label htmlFor="instrument">Instrument</label>
                <select
                  id="instrument"
                  {...register('instrument')}
                  disabled={instrumentsQuery.isFetching}
                  className={errors.instrument && !isSubmitting ? 'error' : ''}
                >
                  <option value="">
                    {instrumentsQuery.isFetching ? 'Loading...' : 'Select instrument'}
                  </option>
                  {instruments.map((inst, index) => (
                    <option key={index} value={inst.name}>
                      {inst.name} ({inst.ticker})
                    </option>
                  ))}
                </select>
                {errors.instrument && !isSubmitting && (
                  <p className="error-text">{errors.instrument.message}</p>
                )}
              </div>
              <div className="form-group full-width">
                <label htmlFor="notes">Notes (optional)</label>
                <textarea
                  id="notes"
                  rows={3}
                  {...register('notes')}
                  className={errors.notes && !isSubmitting ? 'error' : ''}
                />
                {errors.notes && !isSubmitting && (
                  <p className="error-text">{errors.notes.message}</p>
                )}
              </div>
            </div>
            <div className="form-actions">
              <button 
                type="submit" 
                className="primary-btn" 
                disabled={isSubmitting || instrumentsQuery.isFetching}
              >
                {isSubmitting ? 'Submitting...' : 'Submit mandate'}
              </button>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => briefQuery.data && reset(briefQuery.data.data as unknown as ServicesFormValues)}
              >
                Reset
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}
