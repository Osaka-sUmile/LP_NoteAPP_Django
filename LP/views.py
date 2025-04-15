from django.shortcuts import render

def index(request):
    return render(request, "LP/mainpage.html")

def PrivacyPolicy(request):
    return render(request, "LP/privacy_policy.html")