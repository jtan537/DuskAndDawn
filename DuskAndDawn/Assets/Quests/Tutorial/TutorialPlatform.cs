using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Yarn.Unity;

public class TutorialPlatform : MonoBehaviour
{
    VariableStorageBehaviour _varStorage;

    private void Start()
    {
        _varStorage = GameObject.FindObjectOfType<VariableStorageBehaviour>().GetComponent<VariableStorageBehaviour>();
        gameObject.GetComponent<BoxCollider>().enabled = false;
        gameObject.GetComponent<MeshRenderer>().enabled = false;
    }
    // Update is called once per frame
    void Update()
    {
        bool turnedOnSwitch = _varStorage.GetValue("$turned_on_switch").AsBool;
        if (turnedOnSwitch)
        {
            gameObject.GetComponent<BoxCollider>().enabled = true;
            gameObject.GetComponent<MeshRenderer>().enabled = true;
        }
    }
}
