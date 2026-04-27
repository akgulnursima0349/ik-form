export function SuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md text-center space-y-6 rounded-2xl bg-white p-10 shadow-sm border border-gray-100">
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <svg className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Formunuz başarıyla gönderildi!</h1>
          <p className="text-gray-500">
            HR ekibimiz belgelerinizi inceleyerek en kısa sürede sizinle iletişime geçecektir.
          </p>
        </div>
        <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Başvurunuz inceleme aşamasındadır. Sonuç e-posta adresinize iletilecektir.
        </div>
      </div>
    </div>
  );
}
